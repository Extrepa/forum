import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';
import { formatDateTime } from '../../../lib/dates';
import Breadcrumbs from '../../../components/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default async function ForumThreadPage({ params, searchParams }) {
  const db = await getDb();
  const thread = await db
    .prepare(
      `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
              forum_threads.created_at, forum_threads.image_key,
              users.username AS author_name
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       WHERE forum_threads.id = ?`
    )
    .bind(params.id)
    .first();

  if (!thread) {
    return (
      <div className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This thread does not exist.</p>
      </div>
    );
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

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Claim a username before replying.'
      : error === 'missing'
      ? 'Reply text is required.'
      : null;

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/forum', label: 'General' },
          { href: `/forum/${thread.id}`, label: thread.title },
        ]}
      />
      <section className="card thread-container">
        {/* Original Post */}
        <div className="thread-post">
          <h2 className="section-title">{thread.title}</h2>
          <div className="list-meta">
            {thread.author_name} · {formatDateTime(thread.created_at)}
          </div>
          {thread.image_key ? (
            <img
              src={`/api/media/${thread.image_key}`}
              alt=""
              className="post-image"
              loading="lazy"
            />
          ) : null}
          <div
            className="post-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(thread.body) }}
          />
        </div>

        {/* Replies Section */}
        <div className="thread-replies">
          <h3 className="section-title" style={{ marginTop: '24px', marginBottom: '16px' }}>Replies ({replies.length})</h3>
          {notice ? <div className="notice">{notice}</div> : null}
          
          {replies.length > 0 && (
            <div className="replies-list">
              {replies.map((reply) => (
                <div key={reply.id} className="reply-item">
                  <div className="reply-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="reply-author">{reply.author_name}</span>
                    <span className="reply-time">{formatDateTime(reply.created_at)}</span>
                  </div>
                  <div
                    className="reply-body"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.body) }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Reply Form */}
          <form action={`/api/forum/${thread.id}/replies`} method="post" className="reply-form">
            <label>
              <div className="muted" style={{ marginBottom: '8px' }}>Add a reply</div>
              <textarea name="body" placeholder="Write your reply..." required />
            </label>
            <button type="submit">Post reply</button>
          </form>

          {replies.length === 0 && (
            <p className="muted" style={{ marginTop: '16px' }}>No replies yet. Be the first to reply.</p>
          )}
        </div>
      </section>
    </div>
  );
}
