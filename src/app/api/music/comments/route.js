import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { createMentionNotifications } from '../../../../lib/mentions';
import { sendOutboundNotification } from '../../../../lib/outboundNotifications';
import { insertNotificationWithOptionalSubId } from '../../../../lib/notificationCleanup';

export async function POST(request) {
  const user = await getSessionUser();
  const formData = await request.formData();
  const postId = String(formData.get('post_id') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const replyToIdRaw = String(formData.get('reply_to_id') || '').trim();
  const replyToId = replyToIdRaw || null;
  const redirectUrl = new URL(`/music/${postId}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!postId || !body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  
  // Check if music post is locked (rollout-safe)
  try {
    const post = await db
      .prepare('SELECT is_locked FROM music_posts WHERE id = ?')
      .bind(postId)
      .first();
    if (post && post.is_locked) {
      redirectUrl.searchParams.set('error', 'locked');
      return NextResponse.redirect(redirectUrl, 303);
    }
  } catch (e) {
    // Column might not exist yet, that's okay - allow posting
  }

  let effectiveReplyTo = replyToId;
  if (replyToId) {
    try {
      const parent = await db
        .prepare(
          'SELECT id, reply_to_id FROM music_comments WHERE id = ? AND post_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)'
        )
        .bind(replyToId, postId)
        .first();
      if (!parent) {
        effectiveReplyTo = null;
      } else if (parent.reply_to_id) {
        effectiveReplyTo = parent.reply_to_id;
      }
    } catch (e) {
      effectiveReplyTo = null;
    }
  }
  
  const now = Date.now();
  const commentId = crypto.randomUUID();
  try {
    await db
      .prepare(
        'INSERT INTO music_comments (id, post_id, author_user_id, body, created_at, reply_to_id) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(commentId, postId, user.id, body, now, effectiveReplyTo)
      .run();
  } catch (e) {
    await db
      .prepare(
        'INSERT INTO music_comments (id, post_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(commentId, postId, user.id, body, now)
      .run();
  }

  // Create in-app notifications for music post author + participants (excluding the commenter).
  try {
    // Create mention notifications
    await createMentionNotifications({
      text: body,
      actorId: user.id,
      targetType: 'music_post',
      targetId: postId,
      requestUrl: request.url
    });

    const musicPostAuthor = await db
      .prepare('SELECT author_user_id, title, notify_comment_enabled, u.email, u.phone, u.notify_email_enabled, u.notify_sms_enabled FROM music_posts JOIN users u ON u.id = music_posts.author_user_id WHERE music_posts.id = ?')
      .bind(postId)
      .first();

    const recipients = new Map();
    if (musicPostAuthor?.author_user_id && musicPostAuthor.author_user_id !== user.id && musicPostAuthor.notify_comment_enabled !== 0) {
      recipients.set(musicPostAuthor.author_user_id, musicPostAuthor);
    }

    const { results: participants } = await db
      .prepare(
        `SELECT DISTINCT mc.author_user_id, u.email, u.phone, u.notify_comment_enabled, u.notify_email_enabled, u.notify_sms_enabled 
         FROM music_comments mc
         JOIN users u ON u.id = mc.author_user_id
         WHERE mc.post_id = ? AND mc.is_deleted = 0`
      )
      .bind(postId)
      .all();

    for (const row of participants || []) {
      if (row?.author_user_id && row.author_user_id !== user.id && row.notify_comment_enabled !== 0) {
        recipients.set(row.author_user_id, row);
      }
    }

    const actorUsername = user.username || 'Someone';

    for (const [recipientUserId, recipient] of recipients) {
      await insertNotificationWithOptionalSubId(db, {
        id: crypto.randomUUID(),
        user_id: recipientUserId,
        actor_user_id: user.id,
        type: 'comment',
        target_type: 'music_post',
        target_id: postId,
        created_at: now,
        target_sub_id: commentId
      });

      // Send outbound notification
      try {
        await sendOutboundNotification({
          requestUrl: request.url,
          recipient,
          actorUsername,
          type: 'comment',
          targetType: 'music_post',
          targetId: postId,
          targetTitle: musicPostAuthor?.title,
          bodySnippet: body
        });
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // Notifications table might not exist yet, ignore
  }

  return NextResponse.redirect(redirectUrl, 303);
}
