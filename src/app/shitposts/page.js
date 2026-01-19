import ShitpostsClient from './ShitpostsClient';
import { getDb } from '../../lib/db';

export const dynamic = 'force-dynamic';

export default async function ShitpostsPage({ searchParams }) {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
              forum_threads.created_at, forum_threads.image_key,
              users.username AS author_name,
              (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       WHERE forum_threads.image_key IS NOT NULL
       ORDER BY forum_threads.created_at DESC
       LIMIT 50`
    )
    .all();

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Claim a username before posting.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title and body are required.'
      : null;

  return <ShitpostsClient posts={results} notice={notice} />;
}
