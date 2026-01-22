import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function GET(request, { params }) {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT event_comments.id, event_comments.body, event_comments.created_at,
              users.username AS author_name
       FROM event_comments
       JOIN users ON users.id = event_comments.author_user_id
       WHERE event_comments.event_id = ? AND event_comments.is_deleted = 0
       ORDER BY event_comments.created_at ASC`
    )
    .bind(params.id)
    .all();

  return NextResponse.json(results);
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
  const attending = formData.get('attending') === 'on' || formData.get('attending') === 'true';
  const redirectUrl = new URL(`/events/${params.id}`, request.url);

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
  
  // Check if event is locked (rollout-safe)
  try {
    const event = await db
      .prepare('SELECT is_locked FROM events WHERE id = ?')
      .bind(params.id)
      .first();
    if (event && event.is_locked) {
      redirectUrl.searchParams.set('error', 'locked');
      return NextResponse.redirect(redirectUrl, 303);
    }
  } catch (e) {
    // Column might not exist yet, that's okay - allow posting
  }
  
  // Create comment
  await db
    .prepare(
      'INSERT INTO event_comments (id, event_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), params.id, user.id, body, Date.now())
    .run();

  // Handle RSVP if checkbox was checked
  if (attending) {
    try {
      // Check if already RSVP'd
      const existing = await db
        .prepare('SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?')
        .bind(params.id, user.id)
        .first();

      if (!existing) {
        // Add RSVP
        await db
          .prepare('INSERT INTO event_attendees (id, event_id, user_id, created_at) VALUES (?, ?, ?, ?)')
          .bind(crypto.randomUUID(), params.id, user.id, Date.now())
          .run();
      }
    } catch (e) {
      // event_attendees table might not exist yet, ignore
    }
  }

  return NextResponse.redirect(redirectUrl, 303);
}

