import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';
import { formatDateTime } from '../../../lib/dates';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Username from '../../../components/Username';
import { getUsernameColorIndex } from '../../../lib/usernameColor';
import LikeButton from '../../../components/LikeButton';
import ThreadViewTracker from '../../../components/ThreadViewTracker';
import Pagination from '../../../components/Pagination';
import CollapsibleReplyFormWrapper from '../../../components/CollapsibleReplyFormWrapper';
import EditPostButton from '../../../components/EditPostButton';
import DeletePostButton from '../../../components/DeletePostButton';
import EditThreadForm from '../../../components/EditThreadForm';
import AdminControlsBar from '../../../components/AdminControlsBar';
import { isAdminUser } from '../../../lib/admin';

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
  const isEditing = searchParams?.edit === 'true';
  const db = await getDb();
  let thread = null;
  try {
    thread = await db
      .prepare(
        `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                forum_threads.created_at, forum_threads.image_key, forum_threads.is_locked, forum_threads.author_user_id,
                forum_threads.moved_to_type, forum_threads.moved_to_id,
                users.username AS author_name,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'forum_thread' AND post_id = forum_threads.id) AS like_count
         FROM forum_threads
         JOIN users ON users.id = forum_threads.author_user_id
         WHERE forum_threads.id = ? AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)`
      )
      .bind(params.id)
      .first();
  } catch (e) {
    // Fallback if post_likes table or moved columns don't exist
    try {
      thread = await db
        .prepare(
          `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                  forum_threads.created_at, forum_threads.image_key, forum_threads.is_locked, forum_threads.author_user_id,
                  users.username AS author_name,
                  0 AS like_count
           FROM forum_threads
           JOIN users ON users.id = forum_threads.author_user_id
           WHERE forum_threads.id = ? AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)`
        )
        .bind(params.id)
        .first();
      if (thread) {
        thread.moved_to_id = null;
        thread.moved_to_type = null;
      }
    } catch (e2) {
      // Final fallback: remove is_deleted filter in case column doesn't exist
      try {
        thread = await db
          .prepare(
            `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                    forum_threads.created_at, forum_threads.image_key, forum_threads.is_locked, forum_threads.author_user_id,
                    users.username AS author_name,
                    0 AS like_count
             FROM forum_threads
             JOIN users ON users.id = forum_threads.author_user_id
             WHERE forum_threads.id = ?`
          )
          .bind(params.id)
          .first();
        if (thread) {
          thread.moved_to_id = null;
          thread.moved_to_type = null;
        }
      } catch (e3) {
        thread = null;
      }
    }
  }

  if (!thread) {
    return (
      <div className="card">
        <h2 className="section-title">Thread not found</h2>
        <p className="muted">This thread doesn't exist in the goo.</p>
      </div>
    );
  }

  if (thread.moved_to_id) {
    const to = destUrlFor(thread.moved_to_type, thread.moved_to_id);
    if (to) {
      redirect(to);
    }
  }

  const viewer = await getSessionUser();
  
  // Pagination
  const REPLIES_PER_PAGE = 20;
  const currentPage = Math.max(1, parseInt(searchParams?.page || '1', 10));
  const offset = (currentPage - 1) * REPLIES_PER_PAGE;

  // Get total reply count
  let totalReplies = 0;
  try {
    const totalRepliesResult = await db
      .prepare('SELECT COUNT(*) as count FROM forum_replies WHERE thread_id = ? AND is_deleted = 0')
      .bind(params.id)
      .first();
    totalReplies = totalRepliesResult?.count || 0;
  } catch (e) {
    // Fallback if is_deleted column doesn't exist
    try {
      const totalRepliesResult = await db
        .prepare('SELECT COUNT(*) as count FROM forum_replies WHERE thread_id = ?')
        .bind(params.id)
        .first();
      totalReplies = totalRepliesResult?.count || 0;
    } catch (e2) {
      totalReplies = 0;
    }
  }
  const totalPages = Math.ceil(totalReplies / REPLIES_PER_PAGE);

  // Get replies for current page
  let replies = [];
  try {
      const result = await db
        .prepare(
          `SELECT forum_replies.id, forum_replies.body, forum_replies.created_at, forum_replies.author_user_id,
                  users.username AS author_name
           FROM forum_replies
           JOIN users ON users.id = forum_replies.author_user_id
           WHERE forum_replies.thread_id = ? AND forum_replies.is_deleted = 0
           ORDER BY forum_replies.created_at ASC
           LIMIT ? OFFSET ?`
        )
        .bind(params.id, REPLIES_PER_PAGE, offset)
        .all();
    replies = result?.results || [];
  } catch (e) {
    // Fallback if is_deleted column doesn't exist
    try {
      const result = await db
        .prepare(
          `SELECT forum_replies.id, forum_replies.body, forum_replies.created_at, forum_replies.author_user_id,
                  users.username AS author_name
           FROM forum_replies
           JOIN users ON users.id = forum_replies.author_user_id
           WHERE forum_replies.thread_id = ?
           ORDER BY forum_replies.created_at ASC
           LIMIT ? OFFSET ?`
        )
        .bind(params.id, REPLIES_PER_PAGE, offset)
        .all();
      replies = result?.results || [];
    } catch (e2) {
      replies = [];
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

      if (readState?.last_read_reply_id) {
        // Find first reply after the last read one
        let firstUnread = null;
        try {
          firstUnread = await db
            .prepare(
              `SELECT id FROM forum_replies 
               WHERE thread_id = ? AND is_deleted = 0 AND created_at > (
                 SELECT created_at FROM forum_replies WHERE id = ?
               )
               ORDER BY created_at ASC LIMIT 1`
            )
            .bind(params.id, readState.last_read_reply_id)
            .first();
        } catch (e) {
          // Fallback if is_deleted column doesn't exist
          try {
            firstUnread = await db
              .prepare(
                `SELECT id FROM forum_replies 
                 WHERE thread_id = ? AND created_at > (
                   SELECT created_at FROM forum_replies WHERE id = ?
                 )
                 ORDER BY created_at ASC LIMIT 1`
              )
              .bind(params.id, readState.last_read_reply_id)
              .first();
          } catch (e2) {
            // Ignore
          }
        }
        firstUnreadId = firstUnread?.id || null;
      } else {
        // Never read - if there are replies, first reply is unread
        // If no replies, thread itself is unread (but no jump needed)
        if (replies.length > 0) {
          firstUnreadId = replies[0].id;
        }
      }
    } catch (e) {
      // Table might not exist yet
    }
  }
  const canToggleLock = !!viewer && (viewer.id === thread.author_user_id || viewer.role === 'admin');
  const canEdit = !!viewer && (viewer.id === thread.author_user_id || isAdminUser(viewer));
  const canDelete = !!viewer && (viewer.id === thread.author_user_id || isAdminUser(viewer));
  
  // Check if current user has liked this thread
  let userLiked = false;
  if (viewer) {
    try {
      const likeCheck = await db
        .prepare('SELECT id FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
        .bind('forum_thread', thread.id, viewer.id)
        .first();
      userLiked = !!likeCheck;
    } catch (e) {
      // Table might not exist yet
    }
  }

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Sign in before replying.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'unauthorized'
      ? 'Not authorized to do that.'
      : error === 'locked'
      ? 'Replies are locked on this thread.'
      : error === 'notfound'
      ? 'This thread does not exist.'
      : error === 'missing'
      ? 'Reply text is required.'
      : null;

  return (
    <div className="stack">
      <ThreadViewTracker threadId={params.id} />
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/lobby', label: 'General' },
          { href: `/lobby/${thread.id}`, label: thread.title }
        ]}
      />
      <section className="card thread-container">
        <div className="thread-post">
          <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
            <h2 className="section-title" style={{ margin: 0, flex: 1 }}>
              {thread.title}
            </h2>
            {viewer ? (
              <LikeButton 
                postType="forum_thread" 
                postId={thread.id} 
                initialLiked={userLiked}
                initialCount={Number(thread.like_count || 0)}
              />
            ) : null}
          </div>
          <AdminControlsBar
            postId={thread.id}
            postType="thread"
            canEdit={canEdit && !isEditing}
            canDelete={canDelete}
            canLock={canToggleLock}
            isLocked={thread.is_locked}
            onEdit={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('edit', 'true');
              window.location.href = url.toString();
            }}
            onLockToggle={() => {
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = `/api/forum/${thread.id}/lock`;
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = 'locked';
              input.value = thread.is_locked ? '0' : '1';
              form.appendChild(input);
              document.body.appendChild(form);
              form.submit();
            }}
          />
          <div className="list-meta">
            <Username name={thread.author_name} colorIndex={getUsernameColorIndex(thread.author_name)} /> ·{' '}
            {formatDateTime(thread.created_at)}
            {thread.is_locked ? ' · Replies locked' : null}
          </div>
          {thread.image_key ? <img src={`/api/media/${thread.image_key}`} alt="" className="post-image" loading="lazy" /> : null}
          {isEditing && canEdit ? (
            <EditThreadForm 
              threadId={thread.id} 
              initialTitle={thread.title} 
              initialBody={thread.body}
              onCancel={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('edit');
                window.location.href = url.toString();
              }}
            />
          ) : (
            <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(thread.body) }} />
          )}
        </div>

        <div className="thread-replies">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Replies ({totalReplies})</h3>
            {firstUnreadId && (
              <a 
                href={`#reply-${firstUnreadId}`}
                className="button"
                style={{ fontSize: '14px', padding: '6px 12px' }}
              >
                Jump to first unread
              </a>
            )}
            {totalPages > 1 && (
              <a 
                href={`#reply-${replies[replies.length - 1]?.id || ''}`}
                className="button"
                style={{ fontSize: '14px', padding: '6px 12px', marginLeft: '8px' }}
              >
                Jump to bottom
              </a>
            )}
          </div>
          {notice ? <div className="notice">{notice}</div> : null}

          {replies.length > 0 && (
            <div className="replies-list">
              {(() => {
                let lastName = null;
                let lastIndex = null;

                return replies.map((reply) => {
                  const colorIndex = getUsernameColorIndex(reply.author_name, {
                    avoidIndex: lastIndex,
                    avoidName: lastName
                  });
                  lastName = reply.author_name;
                  lastIndex = colorIndex;

                  const isUnread = firstUnreadId && reply.id === firstUnreadId;
                const currentQuoteIds = searchParams?.quote ? (Array.isArray(searchParams.quote) ? searchParams.quote : [searchParams.quote]) : [];
                const isQuoted = currentQuoteIds.includes(reply.id);
                
                // Build quote URL
                const quoteUrlParams = new URLSearchParams();
                if (searchParams?.page) quoteUrlParams.set('page', searchParams.page);
                if (isQuoted) {
                  // Remove this quote
                  currentQuoteIds.filter(id => id !== reply.id).forEach(id => quoteUrlParams.append('quote', id));
                } else {
                  // Add this quote
                  currentQuoteIds.forEach(id => quoteUrlParams.append('quote', id));
                  quoteUrlParams.append('quote', reply.id);
                }
                const quoteUrl = quoteUrlParams.toString() ? `?${quoteUrlParams.toString()}` : '';
                
                return (
                    <div 
                      key={reply.id} 
                      id={`reply-${reply.id}`}
                      className={`reply-item ${isUnread ? 'reply-unread' : ''}`}
                    >
                      <div
                        className="reply-meta"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}
                      >
                        <span className="reply-author">
                          <Username name={reply.author_name} colorIndex={colorIndex} />
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="reply-time">{formatDateTime(reply.created_at)}</span>
                          {!thread.is_locked && (
                            <a
                              href={quoteUrl}
                              className="button"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              {isQuoted ? 'Unquote' : 'Quote'}
                            </a>
                          )}
                          {viewer && (viewer.id === reply.author_user_id || isAdminUser(viewer)) && (
                            <>
                              <EditPostButton postId={params.id} postType="reply" replyId={reply.id} />
                              <DeletePostButton postId={params.id} postType="reply" replyId={reply.id} />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="reply-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.body) }} />
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              baseUrl={`/lobby/${thread.id}`}
            />
          )}

          {thread.is_locked ? (
            <p className="muted" style={{ marginTop: '12px' }}>
              Replies are locked for this thread.
            </p>
          ) : (
            <CollapsibleReplyFormWrapper 
              threadId={thread.id}
              initialQuotes={(() => {
                const quoteIds = searchParams?.quote ? (Array.isArray(searchParams.quote) ? searchParams.quote : [searchParams.quote]) : [];
                return replies.filter(r => quoteIds.includes(r.id)).map(r => ({
                  id: r.id,
                  author_name: r.author_name,
                  body: r.body
                }));
              })()}
              action={`/api/forum/${thread.id}/replies`}
              buttonLabel="Post reply"
            />
          )}

          {replies.length === 0 && <p className="muted" style={{ marginTop: '16px' }}>No replies yet. Be the first to reply.</p>}
        </div>
      </section>
    </div>
  );
}

