import EventsClient from './EventsClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import Breadcrumbs from '../../components/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default async function EventsPage({ searchParams }) {
  const db = await getDb();
  const { results } = await db
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

  // Pre-render markdown for server component
  const events = results.map(row => ({
    ...row,
    detailsHtml: row.details ? renderMarkdown(row.details) : null
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

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/events', label: 'Events' },
        ]}
      />
      <EventsClient events={events} notice={notice} />
    </>
  );
}
