import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { createMentionNotifications } from '../../../../../lib/mentions';

export async function GET(request, { params }) {
  const { id } = await params;
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT timeline_comments.id, timeline_comments.body, timeline_comments.created_at,
              users.username AS author_name
       FROM timeline_comments
       JOIN users ON users.id = timeline_comments.author_user_id
       WHERE timeline_comments.update_id = ? AND timeline_comments.is_deleted = 0
       ORDER BY timeline_comments.created_at ASC`
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
  const redirectUrl = new URL(`/timeline/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  
  // Check if timeline update is locked (rollout-safe)
  try {
    const update = await db
      .prepare('SELECT is_locked FROM timeline_updates WHERE id = ?')
      .bind(id)
      .first();
    if (update && update.is_locked) {
      redirectUrl.pathname = `/announcements/${id}`;
      redirectUrl.searchParams.set('error', 'locked');
      return NextResponse.redirect(redirectUrl, 303);
    }
  } catch (e) {
    // Column might not exist yet, continue
  }

  const now = Date.now();
  await db
    .prepare(
      'INSERT INTO timeline_comments (id, update_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), id, user.id, body, now)
    .run();

  // Create in-app notifications for timeline update author + participants (excluding the commenter).
  try {
    // Create mention notifications
    await createMentionNotifications({
      text: body,
      actorId: user.id,
      targetType: 'timeline_update',
      targetId: id
    });

    const update = await db
      .prepare('SELECT author_user_id FROM timeline_updates WHERE id = ?')
      .bind(id)
      .first();

    const recipients = new Set();
    if (update?.author_user_id) {
      recipients.add(update.author_user_id);
    }

    const { results: participants } = await db
      .prepare(
        'SELECT DISTINCT author_user_id FROM timeline_comments WHERE update_id = ? AND is_deleted = 0'
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
          'timeline_update',
          id,
          now
        )
        .run();
    }
  } catch (e) {
    // Notifications table might not exist yet, ignore
  }

  return NextResponse.redirect(redirectUrl, 303);
}

