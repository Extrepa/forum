import EventsClient from './EventsClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import { getSessionUser } from '../../lib/auth';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import PostForm from '../../components/PostForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EventsPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const db = await getDb();
  
  let results = [];
  try {
    const out = await db
      .prepare(
        `SELECT events.id, events.title, events.details, events.starts_at,
                events.created_at, events.image_key,
                users.username AS author_name
         FROM events
         JOIN users ON users.id = events.author_user_id
         WHERE events.moved_to_id IS NULL
         ORDER BY events.starts_at ASC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  } catch (e) {
    // Fallback if moved_to_id column doesn't exist
    try {
      const out = await db
        .prepare(
          `SELECT events.id, events.title, events.details, events.starts_at,
                  events.created_at, events.image_key,
                  users.username AS author_name
           FROM events
           JOIN users ON users.id = events.author_user_id
           ORDER BY events.starts_at ASC
           LIMIT 50`
        )
        .all();
      results = out?.results || [];
    } catch (e2) {
      // Even fallback failed, use empty array
      results = [];
    }
  }

  // Check attendance status for current user
  let userAttendingMap = {};
  if (user) {
    try {
      const eventIds = results.map(e => e.id);
      if (eventIds.length > 0) {
        const placeholders = eventIds.map(() => '?').join(',');
        const attendanceResults = await db
          .prepare(`SELECT event_id FROM event_attendees WHERE event_id IN (${placeholders}) AND user_id = ?`)
          .bind(...eventIds, user.id)
          .all();
        attendanceResults?.results?.forEach(r => {
          userAttendingMap[r.event_id] = true;
        });
      }
    } catch (e) {
      // Table might not exist yet
    }
  }

  // Pre-render markdown for server component
  const events = results.map(row => ({
    ...row,
    detailsHtml: row.details ? renderMarkdown(row.details) : null,
    user_attending: !!userAttendingMap[row.id]
  }));

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Sign in before adding an event.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title and date are required.'
      : null;

  const canCreate = !!user && !!user.password_hash;

  return (
    <>
      <PageTopRow
        items={[
          { href: '/', label: 'Home' },
          { href: '/events', label: 'Events' },
        ]}
        right={
          <NewPostModalButton label="Add Event" title="Add Event" disabled={!canCreate}>
            <PostForm
              action="/api/events"
              titleLabel="Event title"
              bodyLabel="Details (optional)"
              buttonLabel="Add Event"
              showDate
              bodyRequired={false}
              showImage={true}
            />
          </NewPostModalButton>
        }
      />
      <EventsClient events={events} notice={notice} />
    </>
  );
}
