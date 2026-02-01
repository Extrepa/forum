import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { normalizeUsername } from '../../../../../lib/username';

const MAX_CONTENT_LENGTH = 2000;

function sanitizeContent(str) {
  if (str == null || typeof str !== 'string') return '';
  return str.trim().slice(0, MAX_CONTENT_LENGTH);
}

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
      `SELECT g.id, g.owner_user_id, g.author_user_id, g.content, g.created_at, u.username AS author_username
       FROM guestbook_entries g
       JOIN users u ON u.id = g.author_user_id
       WHERE g.owner_user_id = ?
       ORDER BY g.created_at DESC
       LIMIT 200`
    )
    .bind(owner.id)
    .all();

  const entries = (rows || []).map((r) => ({
    id: r.id,
    owner_user_id: r.owner_user_id,
    author_user_id: r.author_user_id,
    author_username: r.author_username,
    content: r.content,
    created_at: r.created_at,
  }));

  return NextResponse.json({ entries });
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

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

  if (owner.id === user.id) {
    return NextResponse.json({ error: 'Cannot leave a message on your own guestbook' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const content = sanitizeContent(body.content);
  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const created_at = Date.now();

  await db
    .prepare(
      `INSERT INTO guestbook_entries (id, owner_user_id, author_user_id, content, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, owner.id, user.id, content, created_at)
    .run();

  return NextResponse.json({
    success: true,
    entry: {
      id,
      owner_user_id: owner.id,
      author_user_id: user.id,
      author_username: user.username,
      content,
      created_at,
    },
  });
}
