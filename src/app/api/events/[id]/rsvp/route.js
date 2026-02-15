import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { sendOutboundNotification } from '../../../../../lib/outboundNotifications';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to RSVP.' }, { status: 401 });
  }

  const db = await getDb();
  
  // Check if event exists
  let event = null;
  try {
    event = await db
      .prepare('SELECT id, starts_at, ends_at, COALESCE(attendance_reopened, 0) AS attendance_reopened FROM events WHERE id = ?')
      .bind(id)
      .first();
  } catch (e) {
    event = await db
      .prepare('SELECT id, starts_at FROM events WHERE id = ?')
      .bind(id)
      .first();
  }

  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  }

  const eventEndAt = Number(event.ends_at || event.starts_at || 0);
  const attendanceReopened = Number(event.attendance_reopened || 0) === 1;
  const isClosedByTime = eventEndAt > 0 && Date.now() >= eventEndAt && !attendanceReopened;
  if (isClosedByTime) {
    return NextResponse.json({ error: 'RSVP is closed for this event.', attendance_closed: true }, { status: 400 });
  }

  // Check if already RSVP'd
  const existing = await db
    .prepare('SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?')
    .bind(id, user.id)
    .first();

  if (existing) {
    // Remove RSVP
    await db
      .prepare('DELETE FROM event_attendees WHERE event_id = ? AND user_id = ?')
      .bind(id, user.id)
      .run();
    return NextResponse.json({ attending: false });
  } else {
    // Add RSVP
    await db
      .prepare('INSERT INTO event_attendees (id, event_id, user_id, created_at) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), id, user.id, Date.now())
      .run();

    // Notify event author
    try {
      const author = await db
        .prepare(`
          SELECT e.author_user_id, e.title, u.email, u.phone, u.notify_rsvp_enabled, u.notify_email_enabled, u.notify_sms_enabled
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
            Date.now()
          )
          .run();

        // Send outbound notification
        await sendOutboundNotification({
          requestUrl: request.url,
          recipient: author,
          actorUsername: user.username || 'Someone',
          type: 'rsvp',
          targetType: 'event',
          targetId: id,
          targetTitle: author.title
        });
      }
    } catch (e) {
      // Ignore notification failures
    }

    return NextResponse.json({ attending: true });
  }
}

export async function GET(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ attending: false });
  }

  const db = await getDb();
  const rsvp = await db
    .prepare('SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?')
    .bind(id, user.id)
    .first();

  return NextResponse.json({ attending: !!rsvp });
}
