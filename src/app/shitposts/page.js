import ShitpostsClient from './ShitpostsClient';
import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import PostForm from '../../components/PostForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ShitpostsPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const db = await getDb();
  let results = [];
  try {
    const out = await db
      .prepare(
        `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                forum_threads.created_at, forum_threads.image_key,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
         FROM forum_threads
         JOIN users ON users.id = forum_threads.author_user_id
         WHERE forum_threads.image_key IS NOT NULL
           AND forum_threads.moved_to_id IS NULL
         ORDER BY forum_threads.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                forum_threads.created_at, forum_threads.image_key,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
         FROM forum_threads
         JOIN users ON users.id = forum_threads.author_user_id
         WHERE forum_threads.image_key IS NOT NULL
         ORDER BY forum_threads.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  }

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Sign in before posting.'
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

  const canCreate = !!user && !!user.password_hash;

  return (
    <>
      <PageTopRow
        items={[
          { href: '/', label: 'Home' },
          { href: '/shitposts', label: 'Shitposts' },
        ]}
        right={
          <NewPostModalButton label="New Shitpost" title="New Shitpost" disabled={!canCreate}>
            <PostForm
              action="/api/shitposts"
              titleLabel="Title (optional)"
              bodyLabel="Post whatever you want"
              buttonLabel="Post"
              titleRequired={false}
              showImage={true}
            />
          </NewPostModalButton>
        }
      />
      <ShitpostsClient posts={results} notice={notice} />
    </>
  );
}
