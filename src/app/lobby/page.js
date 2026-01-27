import ForumClient from '../forum/ForumClient';
import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { getSessionUserWithRole } from '../../lib/admin';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import PostForm from '../../components/PostForm';
import { redirect } from 'next/navigation';

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
      users.preferred_username_color_index AS author_color_preference,
      users.role AS author_role,
      (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND (forum_replies.is_deleted = 0 OR forum_replies.is_deleted IS NULL)) AS reply_count,
      COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'forum_thread' AND post_id = forum_threads.id), 0) AS like_count,
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
    ${whereClause.includes('WHERE') ? whereClause.replace(/WHERE\s+/i, 'WHERE (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL) AND ') : `WHERE (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL) ${whereClause}`}
    ORDER BY ${orderBy}
    LIMIT ${limit}
  `;

  try {
    const out = await db.prepare(baseQuery).all();
    const threads = out?.results || [];

    // Add unread status for logged-in users
    if (userId && threads.length > 0) {
      try {
        const threadIds = threads.map(t => t.id);
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

            threads.forEach(thread => {
              const lastReadReplyId = readMap.get(thread.id);
              const latestReplyId = latestReplyMap.get(thread.id);
              thread.is_unread = !lastReadReplyId || (latestReplyId && lastReadReplyId !== latestReplyId);
            });
          } catch (e) {
            // Latest replies query failed, just use read states
            threads.forEach(thread => {
              const lastReadReplyId = readMap.get(thread.id);
              thread.is_unread = !lastReadReplyId;
            });
          }
        } else {
          threads.forEach(thread => {
            thread.is_unread = false;
          });
        }
      } catch (e) {
        // forum_thread_reads table doesn't exist yet, mark all as read
        threads.forEach(thread => {
          thread.is_unread = false;
        });
      }
    } else {
      threads.forEach(thread => {
        thread.is_unread = false;
      });
    }

    return threads;
  } catch (e) {
    // Fallback to simpler query if migrations haven't been applied
    // Use a safe WHERE clause that doesn't reference potentially missing columns
    let safeWhereClause = whereClause;
    // Remove references to is_announcement if it might not exist
    // Also handle case where moved_to_id might not exist
    let hasWhere = safeWhereClause.trim().toUpperCase().startsWith('WHERE');
    if (safeWhereClause.includes('is_announcement') || safeWhereClause.includes('moved_to_id')) {
      // Simplify: just check basic conditions, skip moved_to_id check if column doesn't exist
      if (safeWhereClause.includes("users.role = 'admin'")) {
        // Announcements query - just check role, skip moved_to_id check
        safeWhereClause = `WHERE (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL) AND users.role = 'admin'`;
      } else if (safeWhereClause.includes('is_pinned = 1')) {
        // Stickies query - check pinned, exclude admin
        safeWhereClause = `WHERE (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL) AND forum_threads.is_pinned = 1 AND users.role != 'admin'`;
      } else {
        // Normal threads - check not pinned, not admin
        safeWhereClause = `WHERE (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL) AND forum_threads.is_pinned = 0 AND users.role != 'admin'`;
      }
      hasWhere = true;
    } else if (!hasWhere) {
      // Add is_deleted check if no WHERE clause exists
      safeWhereClause = `WHERE (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL) ${safeWhereClause}`;
      hasWhere = true;
    } else {
      // Add is_deleted check to existing WHERE clause
      safeWhereClause = safeWhereClause.replace('WHERE', 'WHERE (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL) AND');
    }
    
    // Use created_at for ordering in fallback (last_activity_at might not work)
    const safeOrderBy = orderBy.includes('last_activity_at') ? 'forum_threads.created_at DESC' : orderBy;
    
    try {
      const fallbackQuery = `
        SELECT forum_threads.id, forum_threads.title, forum_threads.body,
               forum_threads.created_at, forum_threads.image_key,
               users.username AS author_name,
               (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
        FROM forum_threads
        JOIN users ON users.id = forum_threads.author_user_id
        ${safeWhereClause}
        ORDER BY ${safeOrderBy}
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
    } catch (e2) {
      // Even fallback failed - try absolute simplest query
      try {
        const simpleQuery = `
          SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                 forum_threads.created_at, forum_threads.image_key,
                 users.username AS author_name,
                 (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
          FROM forum_threads
          JOIN users ON users.id = forum_threads.author_user_id
          ORDER BY forum_threads.created_at DESC
          LIMIT ${limit}
        `;
        const out = await db.prepare(simpleQuery).all();
        const threads = out?.results || [];
        threads.forEach(t => {
          t.views = 0;
          t.like_count = 0;
          t.is_pinned = 0;
          t.is_locked = 0;
          t.is_announcement = 0;
          t.last_activity_at = t.created_at;
          t.last_post_author = t.author_name;
          t.is_unread = false;
        });
        return threads;
      } catch (e3) {
        // Even simplest query failed, return empty array
        return [];
      }
    }
  }
}

export default async function LobbyPage({ searchParams }) {
  const user = await getSessionUserWithRole();
  if (!user) {
    redirect('/');
  }
  const db = await getDb();
  const userId = user.id;

  // Get announcements (admin-authored threads, or is_announcement = 1)
  let announcements = [];
  try {
    announcements = await getThreadsWithMetadata(
      db,
      `WHERE (users.role = 'admin' OR forum_threads.is_announcement = 1) AND (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '')`,
      'forum_threads.created_at DESC',
      10,
      userId
    );
  } catch (e) {
    // Fallback if query fails
    announcements = [];
  }

  // Get stickies (pinned threads, excluding announcements)
  let stickies = [];
  try {
    stickies = await getThreadsWithMetadata(
      db,
      `WHERE forum_threads.is_pinned = 1 AND (users.role != 'admin' AND (forum_threads.is_announcement = 0 OR forum_threads.is_announcement IS NULL)) AND (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '')`,
      'last_activity_at DESC',
      20,
      userId
    );
  } catch (e) {
    // Fallback if query fails
    stickies = [];
  }

  // Get normal threads (not pinned, not announcements)
  let threads = [];
  try {
    threads = await getThreadsWithMetadata(
      db,
      `WHERE forum_threads.is_pinned = 0 AND (users.role != 'admin' AND (forum_threads.is_announcement = 0 OR forum_threads.is_announcement IS NULL)) AND (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '')`,
      'last_activity_at DESC',
      50,
      userId
    );
  } catch (e) {
    // Fallback if query fails - try simpler query without new columns
    try {
      const out = await db
        .prepare(
          `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                  forum_threads.created_at, forum_threads.image_key,
                  users.username AS author_name,
                  (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
           FROM forum_threads
           JOIN users ON users.id = forum_threads.author_user_id
           WHERE (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '')
           ORDER BY forum_threads.created_at DESC
           LIMIT 50`
        )
        .all();
        threads = (out?.results || []).map(t => ({
          ...t,
          views: 0,
          like_count: 0,
          is_pinned: 0,
          is_locked: 0,
          is_announcement: 0,
          last_activity_at: t.created_at,
          last_post_author: t.author_name,
          is_unread: false
        }));
    } catch (e2) {
      // Even simpler fallback - no moved_to_id check
      try {
        const out = await db
          .prepare(
            `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                    forum_threads.created_at, forum_threads.image_key,
                    users.username AS author_name,
                    (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
             FROM forum_threads
             JOIN users ON users.id = forum_threads.author_user_id
             ORDER BY forum_threads.created_at DESC
             LIMIT 50`
          )
          .all();
        threads = (out?.results || []).map(t => ({
          ...t,
          views: 0,
          like_count: 0,
          is_pinned: 0,
          is_locked: 0,
          is_announcement: 0,
          last_activity_at: t.created_at,
          last_post_author: t.author_name,
          is_unread: false
        }));
      } catch (e3) {
        threads = [];
      }
    }
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

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect('/');
  }
  const canCreate = !!sessionUser && !!sessionUser.password_hash;

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

