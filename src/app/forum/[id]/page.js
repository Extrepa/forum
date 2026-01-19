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
        <form action={`/api/forum/${thread.id}/replies`} method="post">
          <label>
            <div className="muted">Add a reply</div>
            <textarea name="body" placeholder="Write your reply..." required />
          </label>
          <button type="submit">Post reply</button>
        </form>
        <div className="list">
          {replies.length === 0 ? (
            <p className="muted">No replies yet. Be the first to reply.</p>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className="list-item">
                <div
                  className="post-body"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.body) }}
                />
                <div className="list-meta">
                  {reply.author_name} · {new Date(reply.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
