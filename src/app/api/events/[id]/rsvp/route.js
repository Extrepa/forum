import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to RSVP.' }, { status: 401 });
  }

  const db = await getDb();
  
  // Check if event exists
  const event = await db
    .prepare('SELECT id FROM events WHERE id = ?')
    .bind(params.id)
    .first();

  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  }

  // Check if already RSVP'd
  const existing = await db
    .prepare('SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?')
    .bind(params.id, user.id)
    .first();

  if (existing) {
    // Remove RSVP
    await db
      .prepare('DELETE FROM event_attendees WHERE event_id = ? AND user_id = ?')
      .bind(params.id, user.id)
      .run();
    return NextResponse.json({ attending: false });
  } else {
    // Add RSVP
    await db
      .prepare('INSERT INTO event_attendees (id, event_id, user_id, created_at) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), params.id, user.id, Date.now())
      .run();

    // Notify event author
    try {
      const author = await db
        .prepare(`
          SELECT e.author_user_id, u.notify_rsvp_enabled 
          FROM events e
          JOIN users u ON u.id = e.author_user_id
          WHERE e.id = ?
        `)
        .bind(params.id)
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
            params.id,
            Date.now()
          )
          .run();
      }
    } catch (e) {
      // Ignore notification failures
    }

    return NextResponse.json({ attending: true });
  }
}

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ attending: false });
  }

  const db = await getDb();
  const rsvp = await db
    .prepare('SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?')
    .bind(params.id, user.id)
    .first();

  return NextResponse.json({ attending: !!rsvp });
}
