import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { isAdminUser } from '../../../../lib/admin';

const VALID_TYPES = ['forum_thread', 'timeline_update', 'post', 'event', 'music_post', 'project', 'dev_log'];

export async function GET(request) {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'forum_thread';
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const db = await getDb();
  const queries = {
    forum_thread: `SELECT id, title, body, created_at, author_user_id, is_pinned, is_hidden, is_deleted
      FROM forum_threads ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    timeline_update: `SELECT id, title, body, created_at, author_user_id, is_pinned, is_hidden, is_deleted
      FROM timeline_updates ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    post: `SELECT id, title, body, created_at, author_user_id, type, is_pinned, is_hidden, is_deleted
      FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    event: `SELECT id, title, details, starts_at, created_at, author_user_id, is_pinned, is_hidden, is_deleted
      FROM events ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    music_post: `SELECT id, title, body, url, created_at, author_user_id, is_pinned, is_hidden, is_deleted
      FROM music_posts ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    project: `SELECT id, title, description, created_at, author_user_id, is_pinned, is_hidden, is_deleted
      FROM projects ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    dev_log: `SELECT id, title, body, created_at, author_user_id, is_pinned, is_hidden, is_deleted
      FROM dev_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`
  };

  try {
    const sql = queries[type];
    if (!sql) {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }

    const result = await db.prepare(sql).bind(limit, offset).all();
    const items = (result?.results || []).map((row) => ({
      ...row,
      _type: type
    }));

    return NextResponse.json({ items, type, limit, offset });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
