import PostForm from '../../components/PostForm';
import { getDb } from '../../lib/db';

export const dynamic = 'force-dynamic';

export default async function EventsPage({ searchParams }) {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT events.id, events.title, events.details, events.starts_at,
              events.created_at, users.username AS author_name
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
                {row.details ? <p>{row.details}</p> : null}
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
