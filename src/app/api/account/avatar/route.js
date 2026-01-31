import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { getUploadsBucket, buildImageKey } from '../../../../lib/uploads';
import { ungzipSync } from 'fflate';

const base64ToUint8 = (str) => {
  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
    return new Uint8Array(Buffer.from(str, 'base64'));
  }
  if (typeof globalThis?.atob === 'function') {
    const binary = globalThis.atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  throw new Error('Unable to decode base64 string');
};

const decodeSvgPayload = (svg, encoding) => {
  if (!encoding) return svg;
  if (encoding === 'gzip+base64') {
    const compressed = base64ToUint8(svg);
    const decompressed = ungzipSync(compressed);
    return new TextDecoder().decode(decompressed);
  }
  return svg;
};

export async function POST(request) {
  const user = await getSessionUser();
  
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { svg, state, encoding } = await request.json();

    const finalSvg = decodeSvgPayload(svg, encoding);
    if (!finalSvg) {
      return NextResponse.json({ error: 'Missing SVG content' }, { status: 400 });
    }

    const bucket = await getUploadsBucket();
    const db = await getDb();

    // 1. Upload SVG to R2
    const fileName = `avatar-${user.id}.svg`;
    const imageKey = buildImageKey('avatars', fileName);
    
    await bucket.put(imageKey, finalSvg, {
      httpMetadata: {
        contentType: 'image/svg+xml',
      }
    });

    // 2. Update user record in database
    await db
      .prepare('UPDATE users SET avatar_key = ?, avatar_state = ? WHERE id = ?')
      .bind(imageKey, JSON.stringify(state), user.id)
      .run();

    return NextResponse.json({ 
      success: true, 
      avatar_key: imageKey 
    });
  } catch (e) {
    console.error('Avatar upload failed:', e);
    return NextResponse.json({ error: 'Failed to save avatar' }, { status: 500 });
  }
}
