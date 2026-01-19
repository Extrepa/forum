import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';

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
      <section className="card">
        <h2 className="section-title">{thread.title}</h2>
        <div className="list-meta">
          {thread.author_name} · {new Date(thread.created_at).toLocaleString()}
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
      </section>

      <section className="card">
        <h3 className="section-title">Replies ({replies.length})</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list" style={{ marginBottom: replies.length > 0 ? '20px' : '0' }}>
          {replies.length === 0 ? (
            <p className="muted">No replies yet. Be the first to reply.</p>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className="reply-item">
                <div className="reply-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="reply-author">{reply.author_name}</span>
                  <span className="reply-time">{new Date(reply.created_at).toLocaleString()}</span>
                </div>
                <div
                  className="reply-body"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.body) }}
                />
              </div>
            ))
          )}
        </div>
        <form action={`/api/forum/${thread.id}/replies`} method="post" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(22, 58, 74, 0.3)' }}>
          <label>
            <div className="muted" style={{ marginBottom: '8px' }}>Add a reply</div>
            <textarea name="body" placeholder="Write your reply..." required />
          </label>
          <button type="submit">Post reply</button>
        </form>
      </section>
    </div>
  );
}
