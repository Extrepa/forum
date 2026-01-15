import PostForm from '../../components/PostForm';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';

export const dynamic = 'force-dynamic';

export default async function TimelinePage({ searchParams }) {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body,
              timeline_updates.created_at, timeline_updates.image_key,
              users.username AS author_name
       FROM timeline_updates
       JOIN users ON users.id = timeline_updates.author_user_id
       ORDER BY timeline_updates.created_at DESC
       LIMIT 50`
    )
    .all();

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Claim a username before posting announcements.'
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
        <h2 className="section-title">Announcements</h2>
        <p className="muted">Official updates and pinned notes for the community.</p>
        {notice ? <div className="notice">{notice}</div> : null}
        <PostForm
          action="/api/timeline"
          titleLabel="Title"
          bodyLabel="Update"
          buttonLabel="Post announcement"
          titleRequired={false}
          showImage
        />
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        <div className="list">
          {results.length === 0 ? (
            <p className="muted">No announcements yet. Be the first to post.</p>
          ) : (
            results.map((row) => (
              <div key={row.id} className="list-item">
                <h3>{row.title || 'Update'}</h3>
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
