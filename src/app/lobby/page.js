import ForumClient from '../forum/ForumClient';
import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { getSessionUserWithRole } from '../../lib/admin';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import PostForm from '../../components/PostForm';

export const dynamic = 'force-dynamic';

async function getThreadsWithMetadata(db, whereClause, orderBy, limit = 50, userId = null) {
  const baseQuery = `
    SELECT 
      forum_threads.id,
      forum_threads.title,
      forum_threads.body,
      forum_threads.created_at,
      forum_threads.image_key,
      forum_threads.views,
      forum_threads.is_pinned,
      forum_threads.is_locked,
      forum_threads.is_announcement,
      users.username AS author_name,
      users.role AS author_role,
      (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count,
      COALESCE(
        (SELECT MAX(forum_replies.created_at) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0),
        forum_threads.created_at
      ) AS last_activity_at,
      COALESCE(
        (SELECT users.username FROM forum_replies 
         JOIN users ON users.id = forum_replies.author_user_id 
         WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0 
         ORDER BY forum_replies.created_at DESC LIMIT 1),
        users.username
      ) AS last_post_author
    FROM forum_threads
    JOIN users ON users.id = forum_threads.author_user_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ${limit}
  `;

  try {
    const out = await db.prepare(baseQuery).all();
    const threads = out?.results || [];

    // Add unread status for logged-in users
    if (userId && threads.length > 0) {
      const threadIds = threads.map(t => t.id);
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

      threads.forEach(thread => {
        const lastReadReplyId = readMap.get(thread.id);
        const latestReplyId = latestReplyMap.get(thread.id);
        thread.is_unread = !lastReadReplyId || (latestReplyId && lastReadReplyId !== latestReplyId);
      });
    } else {
      threads.forEach(thread => {
        thread.is_unread = false;
      });
    }

    return threads;
  } catch (e) {
    // Fallback to simpler query if migrations haven't been applied
    const fallbackQuery = `
      SELECT forum_threads.id, forum_threads.title, forum_threads.body,
             forum_threads.created_at, forum_threads.image_key,
             users.username AS author_name,
             (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
      FROM forum_threads
      JOIN users ON users.id = forum_threads.author_user_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limit}
    `;
    const out = await db.prepare(fallbackQuery).all();
    const threads = out?.results || [];
    threads.forEach(t => {
      t.views = 0;
      t.is_pinned = 0;
      t.is_locked = 0;
      t.is_announcement = 0;
      t.last_activity_at = t.created_at;
      t.last_post_author = t.author_name;
      t.is_unread = false;
    });
    return threads;
  }
}

export default async function LobbyPage({ searchParams }) {
  const db = await getDb();
  const user = await getSessionUserWithRole();
  const userId = user?.id || null;

  // Get announcements (admin-authored threads, or is_announcement = 1)
  const announcements = await getThreadsWithMetadata(
    db,
    `WHERE (users.role = 'admin' OR forum_threads.is_announcement = 1) AND (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '')`,
    'forum_threads.created_at DESC',
    10,
    userId
  );

  // Get stickies (pinned threads, excluding announcements)
  const stickies = await getThreadsWithMetadata(
    db,
    `WHERE forum_threads.is_pinned = 1 AND (users.role != 'admin' AND (forum_threads.is_announcement = 0 OR forum_threads.is_announcement IS NULL)) AND (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '')`,
    'last_activity_at DESC',
    20,
    userId
  );

  // Get normal threads (not pinned, not announcements)
  const threads = await getThreadsWithMetadata(
    db,
    `WHERE forum_threads.is_pinned = 0 AND (users.role != 'admin' AND (forum_threads.is_announcement = 0 OR forum_threads.is_announcement IS NULL)) AND (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '')`,
    'last_activity_at DESC',
    50,
    userId
  );

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

  const sessionUser = await getSessionUser();
  const canCreate = !!sessionUser && !sessionUser.must_change_password && !!sessionUser.password_hash;

  return (
    <>
      <PageTopRow
        items={[{ href: '/', label: 'Home' }, { href: '/lobby', label: 'General' }]}
        right={
          <NewPostModalButton label="New Post" title="New Post" disabled={!canCreate}>
            <PostForm
              action="/api/threads"
              titleLabel="Post title"
              bodyLabel="Share your thoughts"
              buttonLabel="Post"
              showImage={false}
            />
          </NewPostModalButton>
        }
      />
      <ForumClient 
        announcements={announcements}
        stickies={stickies}
        threads={threads}
        notice={notice} 
        basePath="/lobby" 
      />
    </>
  );
}

