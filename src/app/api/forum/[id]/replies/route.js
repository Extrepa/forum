import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { sendForumReplyOutbound } from '../../../../../lib/outboundNotifications';

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
    .prepare('SELECT author_user_id, title FROM forum_threads WHERE id = ?')
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

  // Optional outbound delivery (email/SMS) based on preferences + configured provider secrets.
  // Failures should never block posting.
  try {
    if (recipients.size && thread?.title) {
      const placeholders = Array.from(recipients)
        .map(() => '?')
        .join(',');
      const query = `SELECT id, email, phone, notify_email_enabled, notify_sms_enabled FROM users WHERE id IN (${placeholders})`;
      const stmt = db.prepare(query);
      const bound = stmt.bind(...Array.from(recipients));
      const { results } = await bound.all();

      const actorUsername = user.username || 'someone';
      const threadTitle = thread.title || 'a thread';
      const replyBody = body;
      await Promise.all(
        (results || []).map((recipient) =>
          sendForumReplyOutbound({
            requestUrl: request.url,
            recipient,
            actorUsername,
            threadTitle,
            threadId: params.id,
            replyBody
          })
        )
      );
    }
  } catch (e) {
    // swallow
  }

  return NextResponse.redirect(redirectUrl, 303);
}
