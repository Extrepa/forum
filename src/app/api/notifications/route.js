import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ unreadCount: 0, items: [] });
  }

  const db = await getDb();

  const unread = await db
    .prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL')
    .bind(user.id)
    .first();

  try {
    const { results } = await db
      .prepare(
        `SELECT n.id, n.type, n.target_type, n.target_id, n.created_at, n.read_at, n.seen_at,
                u.username AS actor_username
         FROM notifications n
         JOIN users u ON u.id = n.actor_user_id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT 10`
      )
      .bind(user.id)
      .all();

    return NextResponse.json({
      unreadCount: unread?.count || 0,
      items: results || []
    });
  } catch (e) {
    // Rollout-safe: if seen_at column doesn't exist yet, use old query
    const { results } = await db
      .prepare(
        `SELECT n.id, n.type, n.target_type, n.target_id, n.created_at, n.read_at,
                u.username AS actor_username
         FROM notifications n
         JOIN users u ON u.id = n.actor_user_id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT 10`
      )
      .bind(user.id)
      .all();

    return NextResponse.json({
      unreadCount: unread?.count || 0,
      items: results || []
    });
  }
}

