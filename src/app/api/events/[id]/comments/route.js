import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

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
  
  // Check if event is locked (rollout-safe)
  try {
    const event = await db
      .prepare('SELECT is_locked FROM events WHERE id = ?')
      .bind(id)
      .first();
    if (event && event.is_locked) {
      redirectUrl.searchParams.set('error', 'locked');
      return NextResponse.redirect(redirectUrl, 303);
    }
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
    const event = await db
      .prepare('SELECT author_user_id FROM events WHERE id = ?')
      .bind(id)
      .first();

    const recipients = new Set();
    if (event?.author_user_id) {
      recipients.add(event.author_user_id);
    }

    const { results: participants } = await db
      .prepare(
        'SELECT DISTINCT author_user_id FROM event_comments WHERE event_id = ? AND is_deleted = 0'
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
          'event',
          id,
          now
        )
        .run();
    }
  } catch (e) {
    // Notifications table might not exist yet, ignore
  }

  // Handle RSVP if checkbox was checked
  if (attending) {
    try {
      // Check if already RSVP'd
      const existing = await db
        .prepare('SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?')
        .bind(id, user.id)
        .first();

      if (!existing) {
        // Add RSVP
        await db
          .prepare('INSERT INTO event_attendees (id, event_id, user_id, created_at) VALUES (?, ?, ?, ?)')
          .bind(crypto.randomUUID(), id, user.id, Date.now())
          .run();
      }
    } catch (e) {
      // event_attendees table might not exist yet, ignore
    }
  }

  return NextResponse.redirect(redirectUrl, 303);
}

