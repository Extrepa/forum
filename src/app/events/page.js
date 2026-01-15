import PostForm from '../../components/PostForm';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';

export const dynamic = 'force-dynamic';

export default async function EventsPage({ searchParams }) {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT events.id, events.title, events.details, events.starts_at,
              events.created_at, events.image_key,
              users.username AS author_name
       FROM events
       JOIN users ON users.id = events.author_user_id
       ORDER BY events.starts_at ASC
       LIMIT 50`
    )
    .all();

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Claim a username before adding an event.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title and date are required.'
      : null;

  return (
    <div className="stack">
      <section className="card">
        <h2 className="section-title">Events</h2>
        <p className="muted">Lightweight planning for meetups and plans.</p>
        {notice ? <div className="notice">{notice}</div> : null}
        <PostForm
          action="/api/events"
          titleLabel="Event title"
          bodyLabel="Details (optional)"
          buttonLabel="Add event"
          showDate
          bodyRequired={false}
          showImage
        />
      </section>

      <section className="card">
        <h3 className="section-title">Upcoming</h3>
        <div className="list">
          {results.length === 0 ? (
            <p className="muted">No events yet. Add the first plan.</p>
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
                {row.details ? (
                  <div
                    className="post-body"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(row.details) }}
                  />
                ) : null}
                <div className="list-meta">
                  {new Date(row.starts_at).toLocaleString()} · {row.author_name}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
