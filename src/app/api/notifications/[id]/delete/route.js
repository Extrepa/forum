import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();

  // Verify notification belongs to current user
  const notification = await db
    .prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first();

  if (!notification) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Delete the notification
  try {
    await db
      .prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?')
      .bind(id, user.id)
      .run();
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete notification.' }, { status: 500 });
  }

  // Get updated unread count
  const unread = await db
    .prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL')
    .bind(user.id)
    .first();

  return NextResponse.json({ ok: true, unreadCount: unread?.count || 0 });
}
