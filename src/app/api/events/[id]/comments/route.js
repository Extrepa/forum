import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { createMentionNotifications } from '../../../../../lib/mentions';
import { sendOutboundNotification } from '../../../../../lib/outboundNotifications';
import { getEventDayCompletionTimestamp } from '../../../../../lib/dates';

export async function GET(request, { params }) {
  const { id } = await params;
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT event_comments.id, event_comments.body, event_comments.created_at,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference
       FROM event_comments
       JOIN users ON users.id = event_comments.author_user_id
       WHERE event_comments.event_id = ? AND event_comments.is_deleted = 0
       ORDER BY event_comments.created_at ASC`
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
  const attending = formData.get('attending') === 'on' || formData.get('attending') === 'true';
  const redirectUrl = new URL(`/events/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  
  let eventEndsAt = 0;
  let attendanceReopened = 0;
  // Check if event is locked and gather attendance window (rollout-safe)
  try {
    const event = await db
      .prepare('SELECT is_locked, starts_at, ends_at, COALESCE(attendance_reopened, 0) AS attendance_reopened FROM events WHERE id = ?')
      .bind(id)
      .first();
    if (event && event.is_locked) {
      redirectUrl.searchParams.set('error', 'locked');
      return NextResponse.redirect(redirectUrl, 303);
    }
    eventEndsAt = Number(event?.ends_at || event?.starts_at || 0);
    attendanceReopened = Number(event?.attendance_reopened || 0);
  } catch (e) {
    // Column might not exist yet, that's okay - allow posting
  }
  
  // Create comment
  const now = Date.now();
  await db
    .prepare(
      'INSERT INTO event_comments (id, event_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), id, user.id, body, now)
    .run();

  // Create in-app notifications for event author + participants (excluding the commenter).
  try {
    // Create mention notifications
    await createMentionNotifications({
      text: body,
      actorId: user.id,
      targetType: 'event',
      targetId: id,
      requestUrl: request.url
    });

    const eventAuthor = await db
      .prepare('SELECT author_user_id, title, notify_comment_enabled, u.email, u.phone, u.notify_email_enabled, u.notify_sms_enabled FROM events JOIN users u ON u.id = events.author_user_id WHERE events.id = ?')
      .bind(id)
      .first();

    const recipients = new Map();
    if (eventAuthor?.author_user_id && eventAuthor.author_user_id !== user.id && eventAuthor.notify_comment_enabled !== 0) {
      recipients.set(eventAuthor.author_user_id, eventAuthor);
    }

    const { results: participants } = await db
      .prepare(
        `SELECT DISTINCT ec.author_user_id, u.email, u.phone, u.notify_comment_enabled, u.notify_email_enabled, u.notify_sms_enabled 
         FROM event_comments ec
         JOIN users u ON u.id = ec.author_user_id
         WHERE ec.event_id = ? AND ec.is_deleted = 0`
      )
      .bind(id)
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
          'event',
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
          targetType: 'event',
          targetId: id,
          targetTitle: eventAuthor?.title,
          bodySnippet: body
        });
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // Notifications table might not exist yet, ignore
  }

  // Handle RSVP if checkbox was checked
  const completionAt = getEventDayCompletionTimestamp(eventEndsAt);
  const attendanceClosedByTime = completionAt > 0 && Date.now() > completionAt && attendanceReopened !== 1;
  if (attending && !attendanceClosedByTime) {
    try {
      // Check if already RSVP'd
      const existing = await db
        .prepare('SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?')
        .bind(id, user.id)
        .first();

      if (!existing) {
        const nowRsvp = Date.now();
        // Add RSVP
        await db
          .prepare('INSERT INTO event_attendees (id, event_id, user_id, created_at) VALUES (?, ?, ?, ?)')
          .bind(crypto.randomUUID(), id, user.id, nowRsvp)
          .run();

        // Notify event author (if not already notified by the comment itself)
        try {
          const author = await db
            .prepare(`
              SELECT e.author_user_id, u.notify_rsvp_enabled 
              FROM events e
              JOIN users u ON u.id = e.author_user_id
              WHERE e.id = ?
            `)
            .bind(id)
            .first();
          
          if (author?.author_user_id && author.author_user_id !== user.id && author.notify_rsvp_enabled !== 0) {
            await db
              .prepare(
                'INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
              )
              .bind(
                crypto.randomUUID(),
                author.author_user_id,
                user.id,
                'rsvp',
                'event',
                id,
                nowRsvp
              )
              .run();
          }
        } catch (e) {
          // Ignore
        }
      }
    } catch (e) {
      // event_attendees table might not exist yet, ignore
    }
  }

  return NextResponse.redirect(redirectUrl, 303);
}
