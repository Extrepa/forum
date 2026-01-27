import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { createMentionNotifications } from '../../../../lib/mentions';
import { sendOutboundNotification } from '../../../../lib/outboundNotifications';

export async function POST(request) {
  const user = await getSessionUser();
  const formData = await request.formData();
  const postId = String(formData.get('post_id') || '').trim();
  const body = String(formData.get('body') || '').trim();
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
  
  const now = Date.now();
  await db
    .prepare(
      'INSERT INTO music_comments (id, post_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), postId, user.id, body, now)
    .run();

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
      .prepare('SELECT author_user_id, title, notify_comment_enabled, u.email, u.phone, u.notify_email_enabled, u.notify_sms_enabled FROM music_posts JOIN users ON users.id = music_posts.author_user_id WHERE music_posts.id = ?')
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
          'comment',
          'music_post',
          postId,
          now
        )
        .run();

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
