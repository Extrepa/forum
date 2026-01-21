import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
  const redirectUrl = new URL(`/forum/${params.id}`, request.url);

  if (!user) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }
  if (user.must_change_password || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'password');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const now = Date.now();
  await db
    .prepare(
      'INSERT INTO forum_replies (id, thread_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), params.id, user.id, body, now)
    .run();

  // Create in-app notifications for thread author + participants (excluding the replier).
  const thread = await db
    .prepare('SELECT author_user_id FROM forum_threads WHERE id = ?')
    .bind(params.id)
    .first();

  const recipients = new Set();
  if (thread?.author_user_id) {
    recipients.add(thread.author_user_id);
  }

  const { results: participants } = await db
    .prepare(
      'SELECT DISTINCT author_user_id FROM forum_replies WHERE thread_id = ? AND is_deleted = 0'
    )
    .bind(params.id)
    .all();

  for (const row of participants || []) {
    if (row?.author_user_id) {
      recipients.add(row.author_user_id);
    }
  }

  recipients.delete(user.id);

  for (const recipientUserId of recipients) {
    await db
      .prepare(
        `INSERT INTO notifications
          (id, user_id, actor_user_id, type, target_type, target_id, created_at, read_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        recipientUserId,
        user.id,
        'reply',
        'forum_thread',
        params.id,
        now,
        null
      )
      .run();
  }

  return NextResponse.redirect(redirectUrl, 303);
}
