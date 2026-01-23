import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';
import { formatDateTime } from '../../../lib/dates';
import PageTopRow from '../../../components/PageTopRow';
import Username from '../../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../../lib/usernameColor';
import LikeButton from '../../../components/LikeButton';
import ReplyFormWrapper from '../../../components/ReplyFormWrapper';
import DeletePostButton from '../../../components/DeletePostButton';
import EditThreadForm from '../../../components/EditThreadForm';
import EditPostButtonWithPanel from '../../../components/EditPostButtonWithPanel';
import { isAdminUser } from '../../../lib/admin';
import PostHeader from '../../../components/PostHeader';
import ViewTracker from '../../../components/ViewTracker';
import ReplyButton from '../../../components/ReplyButton';

export const dynamic = 'force-dynamic';

function destUrlFor(type, id) {
  switch (type) {
    case 'forum_thread':
      return `/lobby/${id}`;
    case 'project':
      return `/projects/${id}`;
    case 'music_post':
      return `/music/${id}`;
    case 'timeline_update':
      return `/announcements/${id}`;
    case 'event':
      return `/events/${id}`;
    case 'dev_log':
      return `/devlog/${id}`;
    default:
      return null;
  }
}

export default async function LobbyThreadPage({ params, searchParams }) {
  // #region agent log
  const log = (loc, msg, data, hyp) => console.error(`[DEBUG ${hyp||'ALL'}] ${loc}: ${msg}`, JSON.stringify(data||{}));
  log('lobby/[id]/page.js:40', 'Function entry', {threadId:params?.id,hasSearchParams:!!searchParams}, 'ALL');
  // #endregion
  try {
    if (!params?.id) {
      return (
        <div className="card">
          <h2 className="section-title">Error</h2>
          <p className="muted">Invalid thread ID.</p>
        </div>
      );
    }
    
    let db;
    try {
      // #region agent log
      log('lobby/[id]/page.js:52', 'Before getDb()', {threadId:params?.id}, 'ALL');
      // #endregion
      db = await getDb();
      // #region agent log
      log('lobby/[id]/page.js:54', 'After getDb()', {threadId:params?.id,hasDb:!!db}, 'ALL');
      // #endregion
    } catch (dbError) {
      // #region agent log
      log('lobby/[id]/page.js:56', 'getDb() error', {threadId:params?.id,error:dbError?.message,errorStack:dbError?.stack}, 'ALL');
      // #endregion
      console.error('Error getting database connection:', dbError, { threadId: params.id });
      return (
        <div className="card">
          <h2 className="section-title">Error</h2>
          <p className="muted">Database connection failed. Please try again later.</p>
        </div>
      );
    }
    
    if (!db) {
      return (
        <div className="card">
          <h2 className="section-title">Error</h2>
          <p className="muted">Database connection failed. Please try again later.</p>
        </div>
      );
    }
    
    const isEditing = searchParams?.edit === 'true';
    let thread = null;
    try {
      // #region agent log
      log('lobby/[id]/page.js:76', 'Before thread query', {threadId:params?.id}, 'A');
      // #endregion
      thread = await db
        .prepare(
          `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                  forum_threads.created_at, forum_threads.image_key, forum_threads.is_locked, forum_threads.author_user_id,
                  forum_threads.moved_to_type, forum_threads.moved_to_id,
                  COALESCE(forum_threads.views, 0) AS views,
                  COALESCE(users.username, 'Deleted User') AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  (SELECT COUNT(*) FROM post_likes WHERE post_type = 'forum_thread' AND post_id = forum_threads.id) AS like_count
           FROM forum_threads
           LEFT JOIN users ON users.id = forum_threads.author_user_id
           WHERE forum_threads.id = ? AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)`
        )
        .bind(params.id)
        .first();
      // #region agent log
      log('lobby/[id]/page.js:88', 'After thread query', {threadId:params?.id,hasThread:!!thread,threadKeys:thread?Object.keys(thread):[]}, 'A');
      // #endregion
      // Ensure defaults for moved columns
      if (thread) {
        thread.moved_to_id = thread.moved_to_id || null;
        thread.moved_to_type = thread.moved_to_type || null;
        thread.like_count = thread.like_count || 0;
        // #region agent log
        log('lobby/[id]/page.js:90', 'Thread defaults set', {threadId:params?.id,hasMovedToId:!!thread.moved_to_id,likeCount:thread.like_count}, 'A');
        // #endregion
      }
    } catch (e) {
      // #region agent log
      log('lobby/[id]/page.js:95', 'Thread query error', {threadId:params?.id,error:e?.message,errorStack:e?.stack}, 'A');
      // #endregion
      console.error('Error fetching thread:', e, { threadId: params.id });
      // Fallback if post_likes table or moved columns don't exist
      try {
        thread = await db
          .prepare(
            `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                    forum_threads.created_at, forum_threads.image_key, forum_threads.is_locked, forum_threads.author_user_id,
                    COALESCE(forum_threads.views, 0) AS views,
                    COALESCE(users.username, 'Deleted User') AS author_name,
                    users.preferred_username_color_index AS author_color_preference,
                    COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'forum_thread' AND post_id = forum_threads.id), 0) AS like_count
             FROM forum_threads
             LEFT JOIN users ON users.id = forum_threads.author_user_id
             WHERE forum_threads.id = ? AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)`
          )
          .bind(params.id)
          .first();
        if (thread) {
          thread.moved_to_id = thread.moved_to_id || null;
          thread.moved_to_type = thread.moved_to_type || null;
        }
      } catch (e2) {
        // Final fallback: remove is_deleted filter in case column doesn't exist
        try {
          thread = await db
            .prepare(
            `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                    forum_threads.created_at, forum_threads.image_key, forum_threads.is_locked, forum_threads.author_user_id,
                    COALESCE(forum_threads.views, 0) AS views,
                    COALESCE(users.username, 'Deleted User') AS author_name,
                    users.preferred_username_color_index AS author_color_preference,
                    COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'forum_thread' AND post_id = forum_threads.id), 0) AS like_count
             FROM forum_threads
             LEFT JOIN users ON users.id = forum_threads.author_user_id
             WHERE forum_threads.id = ? AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)`
            )
            .bind(params.id)
            .first();
          if (thread) {
            thread.moved_to_id = thread.moved_to_id || null;
            thread.moved_to_type = thread.moved_to_type || null;
          }
        } catch (e3) {
          console.error('Error fetching thread (final fallback):', e3, { threadId: params.id });
          thread = null;
        }
      }
    }

  if (!thread || !thread.id) {
    return (
      <div className="card">
        <h2 className="section-title">Thread not found</h2>
        <p className="muted">This thread doesn't exist in the goo.</p>
      </div>
    );
  }

  // Ensure all thread properties have safe defaults
  thread.title = thread.title || 'Untitled';
  thread.body = thread.body || '';
  thread.author_name = thread.author_name || 'Unknown';
  thread.created_at = thread.created_at || Date.now();
  thread.is_locked = thread.is_locked || false;
  thread.like_count = thread.like_count || 0;
  thread.moved_to_id = thread.moved_to_id || null;
  thread.moved_to_type = thread.moved_to_type || null;

  if (thread.moved_to_id) {
    // #region agent log
    log('lobby/[id]/page.js:145', 'Before redirect', {threadId:params?.id,movedToType:thread.moved_to_type,movedToId:thread.moved_to_id}, 'B');
    // #endregion
    const to = destUrlFor(thread.moved_to_type, thread.moved_to_id);
    // #region agent log
    log('lobby/[id]/page.js:147', 'After destUrlFor', {threadId:params?.id,destUrl:to}, 'B');
    // #endregion
    if (to) {
      // #region agent log
      log('lobby/[id]/page.js:149', 'Calling redirect()', {threadId:params?.id,redirectTo:to}, 'B');
      // #endregion
      redirect(to);
    }
  }

  let viewer = null;
  try {
    viewer = await getSessionUser();
  } catch (e) {
    console.error('Error getting session user:', e, { threadId: params.id });
    // Continue without viewer - user will see limited functionality
  }
  if (!viewer) {
    redirect('/');
  }
  
  // Pagination
  const REPLIES_PER_PAGE = 20;
  let currentPage = 1;
  let offset = 0;
  try {
    currentPage = Math.max(1, parseInt(searchParams?.page || '1', 10));
    offset = (currentPage - 1) * REPLIES_PER_PAGE;
  } catch (e) {
    console.error('Error parsing pagination:', e, { searchParams });
    // Use defaults
  }

  // Get total reply count
  let totalReplies = 0;
  try {
    const totalRepliesResult = await db
      .prepare('SELECT COUNT(*) as count FROM forum_replies WHERE thread_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)')
      .bind(params.id)
      .first();
    totalReplies = totalRepliesResult?.count || 0;
  } catch (e) {
    console.error('Error counting replies:', e, { threadId: params.id });
    // Fallback if is_deleted column doesn't exist
    try {
      const totalRepliesResult = await db
        .prepare('SELECT COUNT(*) as count FROM forum_replies WHERE thread_id = ?')
        .bind(params.id)
        .first();
      totalReplies = totalRepliesResult?.count || 0;
    } catch (e2) {
      console.error('Error counting replies (fallback):', e2, { threadId: params.id });
      totalReplies = 0;
    }
  }
  const totalPages = Math.ceil(totalReplies / REPLIES_PER_PAGE);

  // Get replies for current page
  let replies = [];
  try {
      // #region agent log
      log('lobby/[id]/page.js:185', 'Before replies query', {threadId:params?.id,offset,limit:REPLIES_PER_PAGE}, 'C');
      // #endregion
      const result = await db
        .prepare(
          `SELECT forum_replies.id, forum_replies.body, forum_replies.created_at, forum_replies.author_user_id,
                  forum_replies.reply_to_id,
                  COALESCE(users.username, 'Deleted User') AS author_name,
                  users.preferred_username_color_index AS author_color_preference
           FROM forum_replies
           LEFT JOIN users ON users.id = forum_replies.author_user_id
           WHERE forum_replies.thread_id = ? AND (forum_replies.is_deleted = 0 OR forum_replies.is_deleted IS NULL)
           ORDER BY forum_replies.created_at ASC
           LIMIT ? OFFSET ?`
        )
        .bind(params.id, REPLIES_PER_PAGE, offset)
        .all();
      // #region agent log
      log('lobby/[id]/page.js:195', 'After replies query', {threadId:params?.id,hasResult:!!result,isArray:Array.isArray(result?.results),resultCount:result?.results?.length}, 'C');
      // #endregion
      if (result && Array.isArray(result.results)) {
        replies = result.results.filter(r => r && r.id && r.body && r.author_user_id); // Filter out invalid replies
        // #region agent log
        log('lobby/[id]/page.js:197', 'Replies filtered', {threadId:params?.id,replyCount:replies.length}, 'C');
        // #endregion
      } else {
        replies = [];
      }
  } catch (e) {
    console.error('Error fetching replies:', e, { threadId: params.id, offset, limit: REPLIES_PER_PAGE });
    // Fallback if is_deleted column doesn't exist
    try {
      const result = await db
        .prepare(
          `SELECT forum_replies.id, forum_replies.body, forum_replies.created_at, forum_replies.author_user_id,
                  forum_replies.reply_to_id,
                  COALESCE(users.username, 'Deleted User') AS author_name,
                  users.preferred_username_color_index AS author_color_preference
           FROM forum_replies
           LEFT JOIN users ON users.id = forum_replies.author_user_id
           WHERE forum_replies.thread_id = ?
           ORDER BY forum_replies.created_at ASC
           LIMIT ? OFFSET ?`
        )
        .bind(params.id, REPLIES_PER_PAGE, offset)
        .all();
      if (result && Array.isArray(result.results)) {
        replies = result.results.filter(r => r && r.id && r.body && r.author_user_id); // Filter out invalid replies
      } else {
        replies = [];
      }
    } catch (e2) {
      console.error('Error fetching replies (fallback 1):', e2, { threadId: params.id });
      // Final fallback: try without JOIN if users table has issues
      try {
        const result = await db
          .prepare(
            `SELECT forum_replies.id, forum_replies.body, forum_replies.created_at, forum_replies.author_user_id,
                    forum_replies.reply_to_id
             FROM forum_replies
             WHERE forum_replies.thread_id = ?
             ORDER BY forum_replies.created_at ASC
             LIMIT ? OFFSET ?`
          )
          .bind(params.id, REPLIES_PER_PAGE, offset)
          .all();
        if (result && Array.isArray(result.results)) {
          replies = result.results.map(r => ({
            ...r,
            author_name: r.author_name || 'Unknown User' // Default if user lookup fails
          })).filter(r => r && r.id && r.body && r.author_user_id);
        } else {
          replies = [];
        }
      } catch (e3) {
        console.error('Error fetching replies (fallback 2):', e3, { threadId: params.id });
        replies = [];
      }
    }
  }

  // Calculate first unread reply ID
  let firstUnreadId = null;
  if (viewer) {
    try {
      const readState = await db
        .prepare('SELECT last_read_reply_id FROM forum_thread_reads WHERE user_id = ? AND thread_id = ?')
        .bind(viewer.id, params.id)
        .first();

      if (readState?.last_read_reply_id && params.id) {
        // First, verify the reply exists and get its timestamp safely
        let lastReadReply = null;
        try {
          const replyCheck = await db
            .prepare(
              `SELECT created_at FROM forum_replies 
               WHERE id = ? AND thread_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`
            )
            .bind(String(readState.last_read_reply_id), String(params.id))
            .first();
          if (replyCheck && replyCheck.created_at) {
            lastReadReply = replyCheck;
          }
        } catch (e) {
          // Fallback: try without is_deleted check
          try {
            const replyCheck2 = await db
              .prepare(
                `SELECT created_at FROM forum_replies 
                 WHERE id = ? AND thread_id = ?`
              )
              .bind(String(readState.last_read_reply_id), String(params.id))
              .first();
            if (replyCheck2 && replyCheck2.created_at) {
              lastReadReply = replyCheck2;
            }
          } catch (e2) {
            // Reply doesn't exist or was deleted - treat as never read
            console.error('Error fetching last read reply:', e2, { replyId: readState.last_read_reply_id, threadId: params.id });
            lastReadReply = null;
          }
        }

        if (lastReadReply?.created_at && params.id) {
          // Find first reply after the last read one
          let firstUnread = null;
          try {
            const unreadResult = await db
              .prepare(
                `SELECT id FROM forum_replies 
                 WHERE thread_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) 
                 AND created_at > ?
                 ORDER BY created_at ASC LIMIT 1`
              )
              .bind(String(params.id), Number(lastReadReply.created_at))
              .first();
            if (unreadResult && unreadResult.id) {
              firstUnread = unreadResult;
            }
          } catch (e) {
            // Fallback if is_deleted column doesn't exist
            try {
              const unreadResult2 = await db
                .prepare(
                  `SELECT id FROM forum_replies 
                   WHERE thread_id = ? AND created_at > ?
                   ORDER BY created_at ASC LIMIT 1`
                )
                .bind(String(params.id), Number(lastReadReply.created_at))
                .first();
              if (unreadResult2 && unreadResult2.id) {
                firstUnread = unreadResult2;
              }
            } catch (e2) {
              console.error('Error finding first unread reply:', e2, { threadId: params.id, lastReadAt: lastReadReply.created_at });
            }
          }
          firstUnreadId = firstUnread?.id ? String(firstUnread.id) : null;
        } else {
          // Last read reply doesn't exist - treat as never read
          if (replies.length > 0 && replies[0]?.id) {
            firstUnreadId = String(replies[0].id);
          }
        }
      } else {
        // Never read - if there are replies, first reply is unread
        // If no replies, thread itself is unread (but no jump needed)
        if (replies.length > 0 && replies[0]?.id) {
          firstUnreadId = String(replies[0].id);
        }
      }
    } catch (e) {
      console.error('Error in unread tracking:', e, { threadId: params.id, userId: viewer?.id });
      // Table might not exist yet
    }
  }
  const isAdmin = isAdminUser(viewer);
  const canToggleLock = !!viewer && thread && thread.id && (viewer.id === thread.author_user_id || isAdmin);
  const canEdit = !!viewer && thread && thread.id && !!viewer.password_hash && (viewer.id === thread.author_user_id || isAdmin);
  const canDelete = canEdit;
  
  // Check if current user has liked this thread
  let userLiked = false;
  if (viewer && viewer.id && thread && thread.id) {
    try {
      const likeCheck = await db
        .prepare('SELECT id FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
        .bind('forum_thread', String(thread.id), String(viewer.id))
        .first();
      userLiked = !!(likeCheck && likeCheck.id);
    } catch (e) {
      console.error('Error checking like status:', e, { threadId: thread?.id, userId: viewer?.id });
      // Table might not exist yet
      userLiked = false;
    }
  }

  // Build preferences map and assign unique colors to all usernames on this page
  let usernameColorMap = new Map();
  try {
    // #region agent log
    log('lobby/[id]/page.js:360', 'Before username color assignment', {threadId:params?.id,replyCount:replies?.length}, 'D');
    // #endregion
    const allUsernames = [
      thread?.author_name,
      ...(Array.isArray(replies) ? replies : []).map(r => r?.author_name)
    ].filter(Boolean).filter(name => name && typeof name === 'string');
    
    // Build map of username -> preferred color index
    const preferredColors = new Map();
    if (thread?.author_name && thread?.author_color_preference !== null && thread?.author_color_preference !== undefined) {
      preferredColors.set(thread.author_name, Number(thread.author_color_preference));
    }
    if (Array.isArray(replies)) {
      replies.forEach(r => {
        if (r?.author_name && r?.author_color_preference !== null && r?.author_color_preference !== undefined) {
          preferredColors.set(r.author_name, Number(r.author_color_preference));
        }
      });
    }
    
    if (allUsernames.length > 0) {
      usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);
      // #region agent log
      log('lobby/[id]/page.js:367', 'After username color assignment', {threadId:params?.id,usernameCount:allUsernames.length,mapSize:usernameColorMap.size}, 'D');
      // #endregion
    }
  } catch (e) {
    // #region agent log
    log('lobby/[id]/page.js:369', 'Username color error', {threadId:params?.id,error:e?.message}, 'D');
    // #endregion
    console.error('Error assigning username colors:', e, { threadId: params.id });
    // Fallback: create empty map, will use default colors
    usernameColorMap = new Map();
  }

  // Safely extract searchParams
  let errorParam = null;
  let replyToId = null;
  try {
    if (searchParams && typeof searchParams === 'object') {
      if ('error' in searchParams) {
        errorParam = String(searchParams.error || '');
      }
      if ('replyTo' in searchParams) {
        const replyTo = String(searchParams.replyTo || '').trim();
        replyToId = replyTo || null;
      }
    }
  } catch (e) {
    console.error('Error reading searchParams:', e);
    errorParam = null;
    replyToId = null;
  }
  
  const notice =
    errorParam === 'claim'
      ? 'Log in to post.'
      : errorParam === 'unauthorized'
      ? 'Not authorized to do that.'
      : errorParam === 'locked'
      ? 'Replies are locked on this thread.'
      : errorParam === 'notfound'
      ? 'This thread does not exist.'
      : errorParam === 'missing'
      ? 'Reply text is required.'
      : null;
  
  const editNotice =
    errorParam === 'claim'
      ? 'Log in to post.'
      : errorParam === 'unauthorized'
      ? 'Only the thread author can edit this.'
      : errorParam === 'missing'
      ? 'Title and body are required.'
      : null;
  
  function quoteMarkdown({ author, body }) {
    const safeAuthor = String(author || 'Someone').trim() || 'Someone';
    const text = String(body || '').trim();
    if (!text) return `> @${safeAuthor} said:\n>\n\n`;
    const lines = text.split('\n').slice(0, 8);
    const quoted = lines.map((l) => `> ${l}`).join('\n');
    return `> @${safeAuthor} said:\n${quoted}\n\n`;
  }

  // #region agent log
  log('lobby/[id]/page.js:390', 'Before render', {threadId:params?.id,hasThread:!!thread,replyCount:replies?.length}, 'E');
  // #endregion
  
  // Ensure all values are serializable before rendering - convert to primitives
  const safeThreadId = thread?.id ? String(thread.id) : '';
  const safeThreadTitle = thread?.title ? String(thread.title) : 'Untitled';
  const safeThreadBody = thread?.body ? String(thread.body) : '';
  const safeAuthorName = thread?.author_name ? String(thread.author_name) : 'Unknown';
  const safeThreadCreatedAt = thread?.created_at ? Number(thread.created_at) : null;
  const safeThreadIsLocked = thread?.is_locked ? Boolean(thread.is_locked) : false;
  const safeThreadLikeCount = thread?.like_count ? Number(thread.like_count) : 0;
  const safeThreadViews = thread?.views ? Number(thread.views) : 0;
  const safeThreadImageKey = thread?.image_key ? String(thread.image_key) : null;
  const safeThreadAuthorColorPreference = thread?.author_color_preference !== null && thread?.author_color_preference !== undefined ? Number(thread.author_color_preference) : null;
  
  // Ensure all arrays are properly serialized
  const safeReplies = Array.isArray(replies) 
    ? replies
        .filter(reply => reply && reply.id && reply.body && reply.author_user_id)
        .map(reply => ({
          id: String(reply.id || ''),
          author_name: String(reply.author_name || 'Unknown'),
          author_color_preference: reply.author_color_preference !== null && reply.author_color_preference !== undefined ? Number(reply.author_color_preference) : null,
          body: String(reply.body || ''),
          created_at: reply.created_at ? Number(reply.created_at) : Date.now(),
          author_user_id: String(reply.author_user_id || ''),
          reply_to_id: reply.reply_to_id ? String(reply.reply_to_id) : null
        }))
    : [];
  
  // Find and serialize replyingTo from safeReplies
  const replyingTo = replyToId ? safeReplies.find((r) => r && r.id && r.id === replyToId) : null;
  const replyPrefill = replyingTo ? quoteMarkdown({ author: replyingTo.author_name, body: replyingTo.body }) : '';
  
  // Pre-render markdown to avoid issues
  let threadBodyHtml = '';
  try {
    threadBodyHtml = renderMarkdown(safeThreadBody);
  } catch (e) {
    console.error('Error rendering thread markdown:', e);
    threadBodyHtml = safeThreadBody.replace(/\n/g, '<br>');
  }
  
  // Extract reply rendering logic to avoid IIFE
  const renderReplies = () => {
    if (safeReplies.length === 0) return [];
    
    const byParent = new Map();
    const validReplyIds = new Set(safeReplies.map(r => r.id).filter(Boolean));
    
    for (const r of safeReplies) {
      if (!r || !r.id) continue;
      const key = (r.reply_to_id && validReplyIds.has(r.reply_to_id)) ? r.reply_to_id : null;
      const arr = byParent.get(key) || [];
      arr.push(r);
      byParent.set(key, arr);
    }
    
    const renderReply = (r, { isChild }) => {
      if (!r || !r.id || !r.body) return null;
      const preferredColor = r.author_color_preference !== null && r.author_color_preference !== undefined ? Number(r.author_color_preference) : null;
      const colorIndex = usernameColorMap.get(r.author_name) ?? getUsernameColorIndex(r.author_name || 'Unknown', { preferredColorIndex: preferredColor });
      
      let replyBodyHtml = '';
      try {
        replyBodyHtml = renderMarkdown(r.body);
      } catch (e) {
        console.error('Error rendering reply markdown:', e, { replyId: r.id });
        replyBodyHtml = r.body.replace(/\n/g, '<br>');
      }
      
      const replyLink = `/lobby/${safeThreadId}?replyTo=${encodeURIComponent(r.id)}#reply-form`;
      
      return (
        <div
          key={r.id}
          className={`list-item${isChild ? ' reply-item--child' : ''}`}
          id={`reply-${r.id}`}
        >
          <div className="post-body" dangerouslySetInnerHTML={{ __html: replyBodyHtml }} />
          <div
            className="list-meta"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: '12px', marginTop: '8px' }}
          >
            <span>
              <Username name={r.author_name} colorIndex={colorIndex} preferredColorIndex={preferredColor} />
              {' · '}
              {r.created_at ? formatDateTime(r.created_at) : ''}
            </span>
            <ReplyButton
              replyId={r.id}
              replyAuthor={r.author_name}
              replyBody={r.body}
              replyHref={replyLink}
            />
          </div>
        </div>
      );
    };
    
    const top = byParent.get(null) || [];
    return top.map((r) => {
      const kids = byParent.get(r.id) || [];
      const renderedReply = renderReply(r, { isChild: false });
      const renderedKids = kids.map((c) => renderReply(c, { isChild: true })).filter(Boolean);
      if (!renderedReply) return null;
      return (
        <div key={`thread-${r.id}`} className="stack" style={{ gap: 10 }}>
          {renderedReply}
          {renderedKids.length ? (
            <div className="reply-children">
              {renderedKids}
            </div>
          ) : null}
        </div>
      );
    }).filter(Boolean);
  };
  
  const renderedReplies = renderReplies();
  
  return (
    <div className="stack">
      <PageTopRow
        items={[
          { href: '/', label: 'Home' },
          { href: '/lobby', label: 'General' },
          { href: `/lobby/${safeThreadId}`, label: safeThreadTitle },
        ]}
        right={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isAdmin ? (
              <form action={`/api/forum/${safeThreadId}/lock`} method="post" style={{ margin: 0 }}>
                <input type="hidden" name="locked" value={safeThreadIsLocked ? '0' : '1'} />
                <button
                  type="submit"
                  className="button"
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    minWidth: '56px',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                    <span>{safeThreadIsLocked ? 'Unlock' : 'Lock'}</span>
                    <span>comments</span>
                  </span>
                </button>
              </form>
            ) : null}
            {canEdit ? (
              <>
                <EditPostButtonWithPanel 
                  buttonLabel="Edit Post" 
                  panelId="edit-thread-panel"
                />
                {canDelete ? (
                  <DeletePostButton 
                    postId={safeThreadId} 
                    postType="thread"
                  />
                ) : null}
              </>
            ) : null}
          </div>
        }
      />
      <ViewTracker contentType="forum" contentId={safeThreadId} />
      
      <section className="card">
        <PostHeader
          title={safeThreadTitle}
          author={safeAuthorName}
          authorColorIndex={usernameColorMap.get(safeAuthorName) ?? 0}
          authorPreferredColorIndex={thread?.author_color_preference !== null && thread?.author_color_preference !== undefined ? Number(thread.author_color_preference) : null}
          createdAt={safeThreadCreatedAt}
          likeButton={viewer ? (
            <LikeButton 
              postType="forum_thread" 
              postId={safeThreadId} 
              initialLiked={userLiked}
              initialCount={safeThreadLikeCount}
            />
          ) : null}
        />
        {safeThreadIsLocked ? (
          <span className="muted" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            Replies locked
          </span>
        ) : null}
        {safeThreadImageKey ? <img src={`/api/media/${safeThreadImageKey}`} alt="" className="post-image" loading="lazy" style={{ marginTop: '8px' }} /> : null}
        <div className="post-body" style={{ marginTop: '8px' }} dangerouslySetInnerHTML={{ __html: threadBodyHtml }} />
        {safeThreadViews !== undefined && safeThreadViews !== null && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            fontSize: '12px',
            marginTop: '12px'
          }}>
            <span className="muted">
              {safeThreadViews} {safeThreadViews === 1 ? 'view' : 'views'}
            </span>
          </div>
        )}
      </section>

      {canEdit ? (
        <div id="edit-thread-panel" style={{ display: 'none' }}>
          <section className="card">
            <h3 className="section-title">Edit Thread</h3>
            {editNotice ? <div className="notice">{editNotice}</div> : null}
            <EditThreadForm 
              threadId={safeThreadId}
              initialTitle={safeThreadTitle}
              initialBody={safeThreadBody}
            />
          </section>
        </div>
      ) : null}

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Replies ({totalReplies})</h3>
          {firstUnreadId ? (
            <a 
              href={`#reply-${firstUnreadId}`}
              className="button"
              style={{ fontSize: '14px', padding: '6px 12px' }}
            >
              Jump to first unread
            </a>
          ) : null}
          {totalPages > 1 && safeReplies.length > 0 ? (
            <a 
              href={`#reply-${safeReplies[safeReplies.length - 1].id}`}
              className="button"
              style={{ fontSize: '14px', padding: '6px 12px', marginLeft: '8px' }}
            >
              Jump to bottom
            </a>
          ) : null}
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {renderedReplies.length === 0 ? (
            <p className="muted">No replies yet.</p>
          ) : (
            renderedReplies
          )}
        </div>
        {safeThreadIsLocked ? (
          <div className="muted" style={{ fontSize: 13, marginTop: '12px' }}>
            Replies are locked for this thread.
          </div>
        ) : (
          <div style={{ marginTop: '12px' }} id="reply-form">
            <ReplyFormWrapper
              action={`/api/forum/${safeThreadId}/replies`}
              buttonLabel="Post reply"
              placeholder="Share your goo-certified thoughts..."
              labelText="What would you like to say?"
              hiddenFields={{ reply_to_id: replyToId || '' }}
              replyingTo={replyingTo}
              replyPrefill={replyPrefill}
            />
          </div>
        )}
      </section>
    </div>
  );
  } catch (error) {
    // #region agent log
    const log = (loc, msg, data, hyp) => console.error(`[DEBUG ${hyp||'ALL'}] ${loc}: ${msg}`, JSON.stringify(data||{}));
    log('lobby/[id]/page.js:575', 'Top-level catch error', {threadId:params?.id,errorMessage:error?.message,errorStack:error?.stack,errorName:error?.name}, 'ALL');
    // #endregion
    console.error('Error loading lobby thread:', error, { threadId: params.id, errorMessage: error.message, errorStack: error.stack });
    return (
      <div className="card">
        <h2 className="section-title">Error</h2>
        <p className="muted">Unable to load this thread. Please try again later.</p>
      </div>
    );
  }
}

