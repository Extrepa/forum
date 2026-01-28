import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { createMentionNotifications } from '../../../../../lib/mentions';
import { sendOutboundNotification } from '../../../../../lib/outboundNotifications';

export async function GET(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const includePrivate = !!user;
  const db = await getDb();

  try {
    const post = await db.prepare('SELECT type, is_private FROM posts WHERE id = ?').bind(id).first();
    if (!post) {
      return NextResponse.json({ error: 'notfound' }, { status: 404 });
    }
    if (!user && (post.type === 'lore' || post.type === 'memories')) {
      return NextResponse.json({ error: 'notfound' }, { status: 404 });
    }
    if (!includePrivate && post.is_private) {
      return NextResponse.json({ error: 'notfound' }, { status: 404 });
    }

    const out = await db
      .prepare(
        `SELECT post_comments.id, post_comments.body, post_comments.reply_to_id,
                post_comments.created_at, post_comments.is_deleted,
                users.username AS author_name
         FROM post_comments
         JOIN users ON users.id = post_comments.author_user_id
         WHERE post_comments.post_id = ?
           AND post_comments.is_deleted = 0
         ORDER BY post_comments.created_at ASC
         LIMIT 300`
      )
      .bind(id)
      .all();

    return NextResponse.json(out?.results || []);
  } catch (e) {
    return NextResponse.json({ error: 'notready' }, { status: 409 });
  }
}

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const redirectUrl = new URL(request.headers.get('referer') || '/', request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
  const replyToId = String(formData.get('reply_to_id') || '').trim() || null;

  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  let post = null;
  try {
    post = await db.prepare('SELECT type, is_private, is_locked FROM posts WHERE id = ?').bind(id).first();
  } catch (e) {
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!post) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Check if post is locked (rollout-safe)
  if (post.is_locked) {
    redirectUrl.pathname = `/${post.type === 'about' ? 'about' : post.type}/${id}`;
    redirectUrl.searchParams.set('error', 'locked');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Redirect back to the correct section detail page.
  redirectUrl.pathname = `/${post.type === 'about' ? 'about' : post.type}/${id}`;

  // Member-only/private posts are visible to signed-in users, so no extra check here.
  // Lore/Memories section read-visibility is enforced in the page layer.

  // Safe: API routes are server-only, Date.now() does not cause hydration mismatches
  const now = Date.now();
  try {
    await db
      .prepare('INSERT INTO post_comments (id, post_id, author_user_id, body, reply_to_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), id, user.id, body, replyToId, now)
      .run();
  } catch (e) {
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Create in-app notifications for post author + participants (excluding the commenter).
  try {
    // Create mention notifications
    await createMentionNotifications({
      text: body,
      actorId: user.id,
      targetType: post.type === 'about' ? 'about' : post.type,
      targetId: id,
      requestUrl: request.url
    });

    const postAuthor = await db
      .prepare('SELECT author_user_id, title, notify_comment_enabled, u.email, u.phone, u.notify_email_enabled, u.notify_sms_enabled FROM posts JOIN users ON users.id = posts.author_user_id WHERE posts.id = ?')
      .bind(id)
      .first();

    const recipients = new Map();
    if (postAuthor?.author_user_id && postAuthor.author_user_id !== user.id && postAuthor.notify_comment_enabled !== 0) {
      recipients.set(postAuthor.author_user_id, postAuthor);
    }

    const { results: participants } = await db
      .prepare(
        `SELECT DISTINCT pc.author_user_id, u.email, u.phone, u.notify_comment_enabled, u.notify_email_enabled, u.notify_sms_enabled 
         FROM post_comments pc
         JOIN users u ON u.id = pc.author_user_id
         WHERE pc.post_id = ? AND pc.is_deleted = 0`
      )
      .bind(id)
      .all();

    for (const row of participants || []) {
      if (row?.author_user_id && row.author_user_id !== user.id && row.notify_comment_enabled !== 0) {
        recipients.set(row.author_user_id, row);
      }
    }

    const targetType = post.type === 'about' ? 'about' : post.type;
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
          targetType,
          id,
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
          targetType,
          targetId: id,
          targetTitle: postAuthor?.title,
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
