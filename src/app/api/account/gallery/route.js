import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { getUploadsBucket, buildImageKey, isAllowedImage } from '../../../../lib/uploads';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const { results: rows } = await db
    .prepare(
      `SELECT id, user_id, image_key, caption, is_cover, order_index, created_at
       FROM user_gallery_images
       WHERE user_id = ?
       ORDER BY is_cover DESC, order_index ASC, created_at DESC
       LIMIT 10`
    )
    .bind(user.id)
    .all();

  const entries = (rows || []).map((r) => ({
    id: r.id,
    image_key: r.image_key,
    caption: r.caption || '',
    is_cover: Boolean(r.is_cover),
    order_index: r.order_index,
    created_at: r.created_at,
  }));

  return NextResponse.json({ entries });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const imageFile = formData.get('image') ?? formData.get('file');
  if (!imageFile || typeof imageFile === 'string') {
    return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
  }

  const validation = isAllowedImage(imageFile);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.reason === 'too_large' ? 'Image too large' : 'Invalid image type' }, { status: 400 });
  }

  const db = await getDb();
  const { results: countRows } = await db
    .prepare('SELECT COUNT(*) as c FROM user_gallery_images WHERE user_id = ?')
    .bind(user.id)
    .all();
  const count = Number(countRows?.[0]?.c ?? 0);
  if (count >= 10) {
    return NextResponse.json({ error: 'Gallery limited to 10 uploads' }, { status: 400 });
  }

  const bucket = await getUploadsBucket();
  const imageKey = buildImageKey('gallery', imageFile.name || 'image');
  const caption = String(formData.get('caption') || '').trim().slice(0, 500);
  const id = crypto.randomUUID();
  const created_at = Date.now();

  await bucket.put(imageKey, await imageFile.arrayBuffer(), {
    httpMetadata: { contentType: imageFile.type || 'image/jpeg' },
  });

  const order_index = count;

  await db
    .prepare(
      `INSERT INTO user_gallery_images (id, user_id, image_key, caption, is_cover, order_index, created_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`
    )
    .bind(id, user.id, imageKey, caption || null, order_index, created_at)
    .run();

  return NextResponse.json({
    success: true,
    entry: { id, image_key: imageKey, caption: caption || '', is_cover: false, order_index, created_at },
  });
}
