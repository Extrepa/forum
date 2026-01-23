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
                COALESCE(forum_threads.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'forum_thread' AND post_id = forum_threads.id) AS like_count,
                COALESCE((SELECT MAX(created_at) FROM forum_replies WHERE thread_id = forum_threads.id AND is_deleted = 0), forum_threads.created_at) AS last_activity_at
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
                COALESCE(forum_threads.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'forum_thread' AND post_id = forum_threads.id) AS like_count,
                COALESCE((SELECT MAX(created_at) FROM forum_replies WHERE thread_id = forum_threads.id AND is_deleted = 0), forum_threads.created_at) AS last_activity_at
         FROM forum_threads
         JOIN users ON users.id = forum_threads.author_user_id
         WHERE forum_threads.image_key IS NOT NULL
         ORDER BY forum_threads.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  }

  // Add unread status for logged-in users (forum_threads use forum_thread_reads table)
  const userId = user?.id;
  if (userId && results.length > 0) {
    try {
      const threadIds = results.map(t => t.id);
      if (threadIds.length > 0) {
        const placeholders = threadIds.map(() => '?').join(',');
        const readStates = await db
          .prepare(
            `SELECT thread_id, last_read_reply_id FROM forum_thread_reads 
             WHERE user_id = ? AND thread_id IN (${placeholders})`
          )
          .bind(userId, ...threadIds)
          .all();

        const readMap = new Map();
        (readStates?.results || []).forEach(r => {
          readMap.set(r.thread_id, r.last_read_reply_id);
        });

        // Get latest reply IDs for each thread
        try {
          const latestReplies = await db
            .prepare(
              `SELECT r1.thread_id, r1.id AS latest_reply_id 
               FROM forum_replies r1
               INNER JOIN (
                 SELECT thread_id, MAX(created_at) AS max_created_at
                 FROM forum_replies
                 WHERE thread_id IN (${placeholders}) AND is_deleted = 0
                 GROUP BY thread_id
               ) r2 ON r1.thread_id = r2.thread_id AND r1.created_at = r2.max_created_at
               WHERE r1.is_deleted = 0`
            )
            .bind(...threadIds, ...threadIds)
            .all();

          const latestReplyMap = new Map();
          (latestReplies?.results || []).forEach(r => {
            latestReplyMap.set(r.thread_id, r.latest_reply_id);
          });

          results.forEach(thread => {
            const lastReadReplyId = readMap.get(thread.id);
            const latestReplyId = latestReplyMap.get(thread.id);
            thread.is_unread = !lastReadReplyId || (latestReplyId && lastReadReplyId !== latestReplyId);
          });
        } catch (e) {
          // Latest replies query failed, just use read states
          results.forEach(thread => {
            const lastReadReplyId = readMap.get(thread.id);
            thread.is_unread = !lastReadReplyId;
          });
        }
      } else {
        results.forEach(thread => {
          thread.is_unread = false;
        });
      }
    } catch (e) {
      // forum_thread_reads table might not exist yet, mark all as read
      results.forEach(thread => {
        thread.is_unread = false;
      });
    }
  } else {
    results.forEach(thread => {
      thread.is_unread = false;
    });
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
