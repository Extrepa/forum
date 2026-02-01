import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const db = await getDb();
  const row = await db
    .prepare('SELECT id, user_id, image_key FROM user_gallery_images WHERE id = ?')
    .bind(id)
    .first();

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (row.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.prepare('DELETE FROM user_gallery_images WHERE id = ?').bind(id).run();
  return NextResponse.json({ success: true });
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const db = await getDb();
  const row = await db
    .prepare('SELECT id, user_id FROM user_gallery_images WHERE id = ?')
    .bind(id)
    .first();

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (row.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.prepare('UPDATE user_gallery_images SET is_cover = 0 WHERE user_id = ?').bind(user.id).run();
  await db.prepare('UPDATE user_gallery_images SET is_cover = 1 WHERE id = ?').bind(id).run();

  return NextResponse.json({ success: true, is_cover: true });
}
