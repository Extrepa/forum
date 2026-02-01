import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { normalizeUsername } from '../../../../../lib/username';

export async function GET(request, { params }) {
  const { username } = await params;
  const db = await getDb();
  const normalized = normalizeUsername(username);

  const owner = await db
    .prepare('SELECT id FROM users WHERE username_norm = ?')
    .bind(normalized)
    .first();

  if (!owner) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { results: rows } = await db
    .prepare(
      `SELECT id, user_id, image_key, caption, is_cover, order_index, created_at
       FROM user_gallery_images
       WHERE user_id = ?
       ORDER BY is_cover DESC, order_index ASC, created_at DESC
       LIMIT 10`
    )
    .bind(owner.id)
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
