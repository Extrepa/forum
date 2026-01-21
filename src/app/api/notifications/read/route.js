import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const db = await getDb();
  const now = Date.now();

  if (payload.all) {
    try {
      await db
        .prepare('UPDATE notifications SET read_at = ?, seen_at = ? WHERE user_id = ? AND read_at IS NULL')
        .bind(now, now, user.id)
        .run();
    } catch (e) {
      // Rollout-safe: if seen_at column doesn't exist yet, use old query
      await db
        .prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL')
        .bind(now, user.id)
        .run();
    }
  } else {
    const id = String(payload.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Missing notification id.' }, { status: 400 });
    }
    try {
      await db
        .prepare('UPDATE notifications SET read_at = ?, seen_at = ? WHERE id = ? AND user_id = ?')
        .bind(now, now, id, user.id)
        .run();
    } catch (e) {
      // Rollout-safe: if seen_at column doesn't exist yet, use old query
      await db
        .prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?')
        .bind(now, id, user.id)
        .run();
    }
  }

  const unread = await db
    .prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL')
    .bind(user.id)
    .first();

  return NextResponse.json({ ok: true, unreadCount: unread?.count || 0 });
}

