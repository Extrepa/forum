import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';
import { formatDateTime } from '../../../lib/dates';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Username from '../../../components/Username';
import { getUsernameColorIndex } from '../../../lib/usernameColor';

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
  const db = await getDb();
  let thread = null;
  try {
    thread = await db
      .prepare(
        `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                forum_threads.created_at, forum_threads.image_key, forum_threads.is_locked, forum_threads.author_user_id,
                forum_threads.moved_to_type, forum_threads.moved_to_id,
                users.username AS author_name
         FROM forum_threads
         JOIN users ON users.id = forum_threads.author_user_id
         WHERE forum_threads.id = ?`
      )
      .bind(params.id)
      .first();
  } catch (e) {
    thread = await db
      .prepare(
        `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                forum_threads.created_at, forum_threads.image_key, forum_threads.is_locked, forum_threads.author_user_id,
                users.username AS author_name
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
  }

  if (!thread) {
    return (
      <div className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This thread does not exist.</p>
      </div>
    );
  }

  if (thread.moved_to_id) {
    const to = destUrlFor(thread.moved_to_type, thread.moved_to_id);
    if (to) {
      redirect(to);
    }
  }

  const { results: replies } = await db
    .prepare(
      `SELECT forum_replies.id, forum_replies.body, forum_replies.created_at,
              users.username AS author_name
       FROM forum_replies
       JOIN users ON users.id = forum_replies.author_user_id
       WHERE forum_replies.thread_id = ? AND forum_replies.is_deleted = 0
       ORDER BY forum_replies.created_at ASC`
    )
    .bind(params.id)
    .all();

  const viewer = await getSessionUser();
  const canToggleLock = !!viewer && (viewer.id === thread.author_user_id || viewer.role === 'admin');

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Sign in before replying.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'unauthorized'
      ? 'Unauthorized.'
      : error === 'locked'
      ? 'Replies are locked on this thread.'
      : error === 'notfound'
      ? 'This thread does not exist.'
      : error === 'missing'
      ? 'Reply text is required.'
      : null;

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/lobby', label: 'Lobby' },
          { href: `/lobby/${thread.id}`, label: thread.title }
        ]}
      />
      <section className="card thread-container">
        <div className="thread-post">
          <div className="post-header">
            <h2 className="section-title" style={{ margin: 0 }}>
              {thread.title}
            </h2>
            {canToggleLock ? (
              <form action={`/api/forum/${thread.id}/lock`} method="post">
                <input type="hidden" name="locked" value={thread.is_locked ? '0' : '1'} />
                <button
                  type="submit"
                  className="icon-button"
                  aria-label={thread.is_locked ? 'Unlock replies' : 'Lock replies'}
                  title={thread.is_locked ? 'Unlock replies' : 'Lock replies'}
                >
                  {thread.is_locked ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M17 11V8a5 5 0 0 0-9.7-1.7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x="5"
                        y="11"
                        width="14"
                        height="10"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M8 11V8a4 4 0 0 1 8 0v3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x="5"
                        y="11"
                        width="14"
                        height="10"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </button>
              </form>
            ) : null}
          </div>
          <div className="list-meta">
            <Username name={thread.author_name} colorIndex={getUsernameColorIndex(thread.author_name)} /> ·{' '}
            {formatDateTime(thread.created_at)}
            {thread.is_locked ? ' · Replies locked' : null}
          </div>
          {thread.image_key ? <img src={`/api/media/${thread.image_key}`} alt="" className="post-image" loading="lazy" /> : null}
          <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(thread.body) }} />
        </div>

        <div className="thread-replies">
          <h3 className="section-title">Replies ({replies.length})</h3>
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

                  return (
                    <div key={reply.id} className="reply-item">
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
                        <span className="reply-time">{formatDateTime(reply.created_at)}</span>
                      </div>
                      <div className="reply-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.body) }} />
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {thread.is_locked ? (
            <p className="muted" style={{ marginTop: '12px' }}>
              Replies are locked for this thread.
            </p>
          ) : (
            <form action={`/api/forum/${thread.id}/replies`} method="post" className="reply-form">
              <label>
                <div className="muted" style={{ marginBottom: '8px' }}>
                  Add a reply
                </div>
                <textarea name="body" placeholder="Write your reply..." required />
              </label>
              <button type="submit">Post reply</button>
            </form>
          )}

          {replies.length === 0 && <p className="muted" style={{ marginTop: '16px' }}>No replies yet. Be the first to reply.</p>}
        </div>
      </section>
    </div>
  );
}

