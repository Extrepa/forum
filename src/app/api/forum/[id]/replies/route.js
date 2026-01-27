import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { sendOutboundNotification } from '../../../../../lib/outboundNotifications';
import { createMentionNotifications } from '../../../../../lib/mentions';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
  const replyToIdRaw = String(formData.get('reply_to_id') || '').trim();
  const replyToId = replyToIdRaw ? replyToIdRaw : null;
  const redirectUrl = new URL(`/lobby/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const threadLock = await db
    .prepare('SELECT is_locked FROM forum_threads WHERE id = ?')
    .bind(id)
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
        .bind(replyToId, id)
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
      .bind(crypto.randomUUID(), id, user.id, body, now, effectiveReplyTo)
      .run();
  } catch (e) {
    // Migration not applied yet - try without reply_to_id
    try {
      await db
        .prepare(
          'INSERT INTO forum_replies (id, thread_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(crypto.randomUUID(), id, user.id, body, now)
        .run();
    } catch (e2) {
      redirectUrl.searchParams.set('error', 'notready');
      return NextResponse.redirect(redirectUrl, 303);
    }
  }

  // Create in-app notifications for thread author + participants (excluding the replier).
  const thread = await db
    .prepare('SELECT author_user_id, title FROM forum_threads WHERE id = ?')
    .bind(id)
    .first();

  // Create mention notifications
  await createMentionNotifications({
    text: body,
    actorId: user.id,
    targetType: 'forum_thread',
    targetId: id,
    requestUrl: request.url
  });

  const actorUsername = user.username || 'Someone';
  const threadTitle = thread?.title || 'a thread';

  const { results: participants } = await db
    .prepare(
      `SELECT DISTINCT fr.author_user_id, u.email, u.phone, u.notify_reply_enabled, u.notify_email_enabled, u.notify_sms_enabled
       FROM forum_replies fr
       JOIN users u ON u.id = fr.author_user_id
       WHERE fr.thread_id = ? AND fr.is_deleted = 0`
    )
    .bind(id)
    .all();

  const recipients = new Map();
  for (const row of participants || []) {
    if (row?.author_user_id && row.author_user_id !== user.id && row.notify_reply_enabled !== 0) {
      recipients.set(row.author_user_id, row);
    }
  }

  // Also check thread author's preference
  const threadAuthor = await db
    .prepare(`
      SELECT author_user_id, u.email, u.phone, u.notify_reply_enabled, u.notify_email_enabled, u.notify_sms_enabled 
      FROM forum_threads 
      JOIN users u ON u.id = forum_threads.author_user_id 
      WHERE forum_threads.id = ?
    `)
    .bind(id)
    .first();

  if (threadAuthor?.author_user_id && threadAuthor.author_user_id !== user.id && threadAuthor.notify_reply_enabled !== 0) {
    recipients.set(threadAuthor.author_user_id, threadAuthor);
  }

  for (const [recipientUserId, recipient] of recipients) {
    await db
      .prepare(
        `INSERT INTO notifications
          (id, user_id, actor_user_id, type, target_type, target_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        recipientUserId,
        user.id,
        'reply',
        'forum_thread',
        id,
        now
      )
      .run();

    // Optional outbound delivery
    try {
      await sendOutboundNotification({
        requestUrl: request.url,
        recipient,
        actorUsername,
        type: 'reply',
        targetType: 'forum_thread',
        targetId: id,
        targetTitle: threadTitle,
        bodySnippet: body
      });
    } catch (e) {
      // ignore
    }
  }

  // Redirect to last page after posting, or to nested reply if applicable
  if (effectiveReplyTo) {
    redirectUrl.hash = `reply-${effectiveReplyTo}`;
  } else {
    const db2 = await getDb();
    const totalRepliesResult = await db2
      .prepare('SELECT COUNT(*) as count FROM forum_replies WHERE thread_id = ? AND is_deleted = 0')
      .bind(id)
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
