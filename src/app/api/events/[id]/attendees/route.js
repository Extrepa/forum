import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export async function GET(request, { params }) {
  const { id } = await params;
  const db = await getDb();
  
  let attendees = [];
  try {
    const out = await db
      .prepare(
        `SELECT event_attendees.id, event_attendees.created_at,
                users.username, users.id AS user_id,
                users.preferred_username_color_index AS preferred_username_color_index
         FROM event_attendees
         JOIN users ON users.id = event_attendees.user_id
         WHERE event_attendees.event_id = ?
         ORDER BY event_attendees.created_at ASC`
      )
      .bind(id)
      .all();
    attendees = out?.results || [];
  } catch (e) {
    // Table might not exist yet
    attendees = [];
  }

  return NextResponse.json({ attendees });
}
