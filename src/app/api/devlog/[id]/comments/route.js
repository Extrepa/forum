import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUserWithRole } from '../../../../../lib/admin';
import { getSessionUser } from '../../../../../lib/auth';

export async function GET(request, { params }) {
  const { id } = await params;
  const user = await getSessionUserWithRole();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT dev_log_comments.id, dev_log_comments.body, dev_log_comments.created_at,
              users.username AS author_name
       FROM dev_log_comments
       JOIN users ON users.id = dev_log_comments.author_user_id
       WHERE dev_log_comments.log_id = ? AND dev_log_comments.is_deleted = 0
       ORDER BY dev_log_comments.created_at ASC`
    )
    .bind(id)
    .all();

  return NextResponse.json(results);
}

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
  const replyToIdRaw = String(formData.get('reply_to_id') || '').trim();
  const replyToId = replyToIdRaw ? replyToIdRaw : null;
  const redirectUrl = new URL(`/devlog/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const log = await db
    .prepare('SELECT is_locked FROM dev_logs WHERE id = ?')
    .bind(id)
    .first();

  if (!log) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (log.is_locked) {
    redirectUrl.searchParams.set('error', 'locked');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Enforce one-level threading: only allow replying to a top-level comment.
  let effectiveReplyTo = replyToId;
  if (replyToId) {
    try {
      const parent = await db
        .prepare(
          `SELECT id, reply_to_id
           FROM dev_log_comments
           WHERE id = ? AND log_id = ? AND is_deleted = 0`
        )
        .bind(replyToId, id)
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
  try {
    await db
      .prepare(
        'INSERT INTO dev_log_comments (id, log_id, author_user_id, body, created_at, reply_to_id) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(crypto.randomUUID(), id, user.id, body, now, effectiveReplyTo)
      .run();
  } catch (e) {
    // Migration not applied yet (reply_to_id column missing).
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Create in-app notifications for devlog author + participants (excluding the commenter).
  try {
    const log = await db
      .prepare('SELECT author_user_id FROM dev_logs WHERE id = ?')
      .bind(id)
      .first();

    const recipients = new Set();
    if (log?.author_user_id) {
      recipients.add(log.author_user_id);
    }

    const { results: participants } = await db
      .prepare(
        'SELECT DISTINCT author_user_id FROM dev_log_comments WHERE log_id = ? AND is_deleted = 0'
      )
      .bind(id)
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
            (id, user_id, actor_user_id, type, target_type, target_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          crypto.randomUUID(),
          recipientUserId,
          user.id,
          'comment',
          'dev_log',
          id,
          now
        )
        .run();
    }
  } catch (e) {
    // Notifications table might not exist yet, ignore
  }

  if (effectiveReplyTo) {
    redirectUrl.hash = `reply-${effectiveReplyTo}`;
  }
  return NextResponse.redirect(redirectUrl, 303);
}

