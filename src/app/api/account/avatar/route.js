import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { getUploadsBucket, buildImageKey } from '../../../../lib/uploads';

export async function POST(request) {
  const user = await getSessionUser();
  
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { svg, state } = await request.json();

    if (!svg) {
      return NextResponse.json({ error: 'Missing SVG content' }, { status: 400 });
    }

    const bucket = await getUploadsBucket();
    const db = await getDb();

    // 1. Upload SVG to R2
    const fileName = `avatar-${user.id}.svg`;
    const imageKey = buildImageKey('avatars', fileName);
    
    await bucket.put(imageKey, svg, {
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
