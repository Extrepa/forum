import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Username from '../../../components/Username';
import { getUsernameColorIndex } from '../../../lib/usernameColor';
import { formatEventDate, formatEventDateLarge, formatEventTime, formatRelativeEventDate, isEventUpcoming } from '../../../lib/dates';

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

export default async function EventDetailPage({ params, searchParams }) {
  const db = await getDb();
  const event = await db
    .prepare(
      `SELECT events.id, events.title, events.details, events.starts_at,
              events.created_at, events.image_key,
              events.moved_to_type, events.moved_to_id,
              users.username AS author_name
       FROM events
       JOIN users ON users.id = events.author_user_id
       WHERE events.id = ?`
    )
    .bind(params.id)
    .first();

  if (!event) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This event does not exist.</p>
      </section>
    );
  }

  if (event.moved_to_id) {
    const to = destUrlFor(event.moved_to_type, event.moved_to_id);
    if (to) {
      redirect(to);
    }
  }

  const { results: comments } = await db
    .prepare(
      `SELECT event_comments.id, event_comments.body, event_comments.created_at,
              users.username AS author_name
       FROM event_comments
       JOIN users ON users.id = event_comments.author_user_id
       WHERE event_comments.event_id = ? AND event_comments.is_deleted = 0
       ORDER BY event_comments.created_at ASC`
    )
    .bind(params.id)
    .all();

  const user = await getSessionUser();

  // Get RSVP status and attendees
  let userAttending = false;
  let attendees = [];
  if (user) {
    try {
      const rsvp = await db
        .prepare('SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?')
        .bind(params.id, user.id)
        .first();
      userAttending = !!rsvp;
    } catch (e) {
      // Table might not exist yet
    }

    try {
      const out = await db
        .prepare(
          `SELECT event_attendees.id, event_attendees.created_at,
                  users.username, users.id AS user_id
           FROM event_attendees
           JOIN users ON users.id = event_attendees.user_id
           WHERE event_attendees.event_id = ?
           ORDER BY event_attendees.created_at ASC`
        )
        .bind(params.id)
        .all();
      attendees = out?.results || [];
    } catch (e) {
      // Table might not exist yet
    }
  }

  const error = searchParams?.error;
  const commentNotice =
    error === 'claim'
      ? 'Sign in before commenting.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'missing'
      ? 'Comment text is required.'
      : null;

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/events', label: 'Events' },
          { href: `/events/${event.id}`, label: event.title },
        ]}
      />

      <section className="card">
        <h2 className="section-title">{event.title}</h2>
        <div className="list-meta" style={{ marginBottom: '12px' }}>
          <Username name={event.author_name} colorIndex={getUsernameColorIndex(event.author_name)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '20px', fontWeight: 600 }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--errl-accent-3)', flexShrink: 0 }}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>
            {formatEventDateLarge(event.starts_at)} {formatEventTime(event.starts_at)}
          </span>
          <span className="muted" style={{ fontSize: '14px', fontWeight: 'normal' }}>
            ({formatRelativeEventDate(event.starts_at)})
          </span>
        </div>
        {event.image_key ? (
          <img src={`/api/media/${event.image_key}`} alt="" className="post-image" loading="lazy" />
        ) : null}
        {event.details ? (
          <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(event.details) }} />
        ) : (
          <p className="muted">No details yet.</p>
        )}
      </section>

      {/* Compact attendee list */}
      {attendees.length > 0 && (
        <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--ink)' }}>{attendees.length} {attendees.length === 1 ? 'person' : 'people'} attending:</strong>{' '}
          {attendees.slice(0, 5).map((a, i) => (
            <span key={a.id}>
              <Username name={a.username} colorIndex={getUsernameColorIndex(a.username)} />
              {i < Math.min(attendees.length, 5) - 1 ? ', ' : ''}
            </span>
          ))}
          {attendees.length > 5 && <span className="muted"> and {attendees.length - 5} more</span>}
        </div>
      )}

      <section className="card">
        <h3 className="section-title">Comments</h3>
        {commentNotice ? <div className="notice">{commentNotice}</div> : null}
        {user ? (
          <form action={`/api/events/${event.id}/comments`} method="post">
            <label>
              <div className="muted">Say something</div>
              <textarea name="body" placeholder="Leave a comment" required />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', marginBottom: '10px' }}>
              <input type="checkbox" name="attending" defaultChecked={userAttending} />
              <span>I'm attending</span>
            </label>
            <button type="submit">Post comment</button>
          </form>
        ) : (
          <p className="muted">Sign in to comment.</p>
        )}
        <div className="list">
          {comments.length === 0 ? (
            <p className="muted">No comments yet.</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;
              return comments.map((c) => {
                const colorIndex = getUsernameColorIndex(c.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = c.author_name;
                lastIndex = colorIndex;
                return (
                  <div key={c.id} className="list-item">
                    <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
                    <div
                      className="list-meta"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>
                        <Username name={c.author_name} colorIndex={colorIndex} />
                      </span>
                      <span>{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </section>
    </div>
  );
}

