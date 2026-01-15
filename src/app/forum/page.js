import PostForm from '../../components/PostForm';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';

export const dynamic = 'force-dynamic';

export default async function ForumPage({ searchParams }) {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
              forum_threads.created_at, forum_threads.image_key,
              users.username AS author_name
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       ORDER BY forum_threads.created_at DESC
       LIMIT 50`
    )
    .all();

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Claim a username before posting a thread.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title and body are required.'
      : null;

  return (
    <div className="stack">
      <section className="card">
        <h2 className="section-title">Forum Threads</h2>
        <p className="muted">Share new ideas, questions, and longer discussions.</p>
        {notice ? <div className="notice">{notice}</div> : null}
        <PostForm
          action="/api/threads"
          titleLabel="Thread title"
          bodyLabel="Start the conversation"
          buttonLabel="Create thread"
          showImage
        />
      </section>

      <section className="card">
        <h3 className="section-title">Latest Threads</h3>
        <div className="list">
          {results.length === 0 ? (
            <p className="muted">No threads yet. Start the first conversation.</p>
          ) : (
            results.map((row) => (
              <div key={row.id} className="list-item">
                <h3>{row.title}</h3>
                {row.image_key ? (
                  <img
                    src={`/api/media/${row.image_key}`}
                    alt=""
                    className="post-image"
                    loading="lazy"
                  />
                ) : null}
                <div
                  className="post-body"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(row.body) }}
                />
                <div className="list-meta">
                  {row.author_name} · {new Date(row.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
