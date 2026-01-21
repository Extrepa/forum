import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';
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

export default async function AnnouncementDetailPage({ params, searchParams }) {
  const db = await getDb();
  const update = await db
    .prepare(
      `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body,
              timeline_updates.created_at, timeline_updates.updated_at, timeline_updates.image_key,
              timeline_updates.moved_to_type, timeline_updates.moved_to_id,
              users.username AS author_name
       FROM timeline_updates
       JOIN users ON users.id = timeline_updates.author_user_id
       WHERE timeline_updates.id = ?`
    )
    .bind(params.id)
    .first();

  if (!update) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This announcement does not exist.</p>
      </section>
    );
  }

  if (update.moved_to_id) {
    const to = destUrlFor(update.moved_to_type, update.moved_to_id);
    if (to) {
      redirect(to);
    }
  }

  const { results: comments } = await db
    .prepare(
      `SELECT timeline_comments.id, timeline_comments.body, timeline_comments.created_at,
              users.username AS author_name
       FROM timeline_comments
       JOIN users ON users.id = timeline_comments.author_user_id
       WHERE timeline_comments.update_id = ? AND timeline_comments.is_deleted = 0
       ORDER BY timeline_comments.created_at ASC`
    )
    .bind(params.id)
    .all();

  const user = await getSessionUser();

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
          { href: '/announcements', label: 'Announcements' },
          { href: `/announcements/${update.id}`, label: update.title || 'Update' }
        ]}
      />

      <section className="card">
        <h2 className="section-title">{update.title || 'Update'}</h2>
        <div className="list-meta">
          <Username name={update.author_name} colorIndex={getUsernameColorIndex(update.author_name)} /> ·{' '}
          {new Date(update.created_at).toLocaleString()}
          {update.updated_at ? ` · Updated ${new Date(update.updated_at).toLocaleString()}` : null}
        </div>
        {update.image_key ? <img src={`/api/media/${update.image_key}`} alt="" className="post-image" loading="lazy" /> : null}
        <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(update.body) }} />
      </section>

      <section className="card">
        <h3 className="section-title">Comments</h3>
        {commentNotice ? <div className="notice">{commentNotice}</div> : null}
        {user ? (
          <form action={`/api/timeline/${update.id}/comments`} method="post">
            <label>
              <div className="muted">Say something</div>
              <textarea name="body" placeholder="Leave a comment" required />
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
                  avoidName: lastName
                });
                lastName = c.author_name;
                lastIndex = colorIndex;
                return (
                  <div key={c.id} className="list-item">
                    <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
                    <div className="list-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

