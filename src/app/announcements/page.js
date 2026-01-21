import TimelineClient from '../timeline/TimelineClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import Breadcrumbs from '../../components/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage({ searchParams }) {
  const db = await getDb();
  let results = [];
  try {
    const out = await db
      .prepare(
        `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body,
                timeline_updates.created_at, timeline_updates.image_key,
                users.username AS author_name
         FROM timeline_updates
         JOIN users ON users.id = timeline_updates.author_user_id
         WHERE timeline_updates.moved_to_id IS NULL
         ORDER BY timeline_updates.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body,
                timeline_updates.created_at, timeline_updates.image_key,
                users.username AS author_name
         FROM timeline_updates
         JOIN users ON users.id = timeline_updates.author_user_id
         ORDER BY timeline_updates.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  }

  const updates = results.map((row) => ({
    ...row,
    bodyHtml: renderMarkdown(row.body)
  }));

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Sign in before posting announcements.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title and body are required.'
      : null;

  return (
    <>
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/announcements', label: 'Announcements' }]} />
      <TimelineClient updates={updates} notice={notice} basePath="/announcements" />
    </>
  );
}

