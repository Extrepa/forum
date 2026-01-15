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
    'DELETE FROM timeline_comments',
    'DELETE FROM forum_replies',
    'DELETE FROM timeline_updates',
    'DELETE FROM forum_threads',
    'DELETE FROM events',
    'DELETE FROM users'
  ];

  for (const sql of statements) {
    await db.prepare(sql).run();
  }

  return NextResponse.json({ ok: true });
}
