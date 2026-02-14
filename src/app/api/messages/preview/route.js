import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

function truncate(value, max = 70) {
  const input = typeof value === 'string' ? value.trim() : '';
  if (!input) return '';
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1)}…`;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT g.id, g.content, g.created_at, u.username AS author_username
       FROM guestbook_entries g
       JOIN users u ON u.id = g.author_user_id
       WHERE g.owner_user_id = ?
       ORDER BY g.created_at DESC
       LIMIT 8`
    )
    .bind(user.id)
    .all();

  const items = (results || []).map((row) => ({
    id: row.id,
    author_username: row.author_username || 'Someone',
    preview: truncate(row.content),
    created_at: row.created_at || 0,
    profileHref: row.author_username ? `/profile/${encodeURIComponent(row.author_username)}` : '/messages'
  }));

  return NextResponse.json({ items });
}
