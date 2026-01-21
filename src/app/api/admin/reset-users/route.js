import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../../lib/db';

export async function POST(request) {
  const { env } = await getCloudflareContext({ async: true });
  const adminToken = env.ADMIN_RESET_TOKEN;
  const provided = request.headers.get('x-admin-token');

  if (!adminToken || provided !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const statements = [
    'DELETE FROM likes',
    'DELETE FROM reports',
    'DELETE FROM content_moves',
    'DELETE FROM dev_log_comments',
    'DELETE FROM timeline_comments',
    'DELETE FROM event_comments',
    'DELETE FROM forum_replies',
    'DELETE FROM dev_logs',
    'DELETE FROM timeline_updates',
    'DELETE FROM forum_threads',
    'DELETE FROM events',
    'DELETE FROM music_ratings',
    'DELETE FROM music_comments',
    'DELETE FROM music_posts',
    'DELETE FROM project_comments',
    'DELETE FROM project_updates',
    'DELETE FROM projects',
    'DELETE FROM users'
  ];

  for (const sql of statements) {
    await db.prepare(sql).run();
  }

  return NextResponse.json({ ok: true });
}
