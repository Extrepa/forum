import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { sendForumReplyOutbound } from '../../../../../lib/outboundNotifications';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
  const replyToIdRaw = String(formData.get('reply_to_id') || '').trim();
  const replyToId = replyToIdRaw ? replyToIdRaw : null;
  const redirectUrl = new URL(`/lobby/${params.id}`, request.url);

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
  const threadLock = await db
    .prepare('SELECT is_locked FROM forum_threads WHERE id = ?')
    .bind(params.id)
    .first();

  if (!threadLock) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (threadLock.is_locked) {
    redirectUrl.searchParams.set('error', 'locked');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Enforce one-level threading: only allow replying to a top-level reply.
  let effectiveReplyTo = replyToId;
  if (replyToId) {
    try {
      const parent = await db
        .prepare(
          `SELECT id, reply_to_id
           FROM forum_replies
           WHERE id = ? AND thread_id = ? AND is_deleted = 0`
        )
        .bind(replyToId, params.id)
        .first();
      if (!parent) {
        effectiveReplyTo = null;
      } else if (parent.reply_to_id) {
        // Parent is already a child; clamp to one level by replying to the top-level parent.
        effectiveReplyTo = parent.reply_to_id;
      }
    } catch (e) {
      // If migrations aren't applied yet, just ignore reply-to and post as top-level.
      effectiveReplyTo = null;
    }
  }

  const now = Date.now();
  try {
    await db
      .prepare(
        `INSERT INTO forum_replies (id, thread_id, author_user_id, body, created_at, reply_to_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(crypto.randomUUID(), params.id, user.id, body, now, effectiveReplyTo)
      .run();
  } catch (e) {
    // Migration not applied yet - try without reply_to_id
    try {
      await db
        .prepare(
          'INSERT INTO forum_replies (id, thread_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(crypto.randomUUID(), params.id, user.id, body, now)
        .run();
    } catch (e2) {
      redirectUrl.searchParams.set('error', 'notready');
      return NextResponse.redirect(redirectUrl, 303);
    }
  }

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

  // Redirect to last page after posting, or to nested reply if applicable
  if (effectiveReplyTo) {
    redirectUrl.hash = `reply-${effectiveReplyTo}`;
  } else {
    const db2 = await getDb();
    const totalRepliesResult = await db2
      .prepare('SELECT COUNT(*) as count FROM forum_replies WHERE thread_id = ? AND is_deleted = 0')
      .bind(params.id)
      .first();
    const totalReplies = totalRepliesResult?.count || 0;
    const REPLIES_PER_PAGE = 20;
    const totalPages = Math.ceil(totalReplies / REPLIES_PER_PAGE);
    
    if (totalPages > 1) {
      redirectUrl.searchParams.set('page', totalPages.toString());
    }
  }

  return NextResponse.redirect(redirectUrl, 303);
}
