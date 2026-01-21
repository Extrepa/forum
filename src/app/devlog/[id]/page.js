import DevLogForm from '../../../components/DevLogForm';
import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { isAdminUser } from '../../../lib/admin';
import { getSessionUser } from '../../../lib/auth';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Username from '../../../components/Username';
import { getUsernameColorIndex } from '../../../lib/usernameColor';
import EditPostPanel from '../../../components/EditPostPanel';
import LikeButton from '../../../components/LikeButton';

export const dynamic = 'force-dynamic';

function quoteMarkdown({ author, body }) {
  const safeAuthor = String(author || 'Someone').trim() || 'Someone';
  const text = String(body || '').trim();
  if (!text) return `> @${safeAuthor} said:\n>\n\n`;
  const lines = text.split('\n').slice(0, 8);
  const quoted = lines.map((l) => `> ${l}`).join('\n');
  return `> @${safeAuthor} said:\n${quoted}\n\n`;
}

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

function parseLinksList(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const urls = [];
  for (const line of lines) {
    try {
      const u = new URL(line);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        urls.push(u.toString());
      }
    } catch (e) {
      // ignore invalid URLs
    }
  }
  return urls;
}

export default async function DevLogDetailPage({ params, searchParams }) {
  const user = await getSessionUser();
  const isAdmin = isAdminUser(user);

  if (!user) {
    return (
      <section className="card">
        <h2 className="section-title">Development</h2>
        <p className="muted">Sign in to view this post.</p>
      </section>
    );
  }

  const db = await getDb();
  let log = null;
  let dbUnavailable = false;
  try {
    log = await db
      .prepare(
        `SELECT dev_logs.id, dev_logs.author_user_id, dev_logs.title, dev_logs.body, dev_logs.image_key,
                dev_logs.is_locked,
                dev_logs.created_at, dev_logs.updated_at,
                dev_logs.moved_to_type, dev_logs.moved_to_id,
                dev_logs.github_url, dev_logs.demo_url, dev_logs.links,
                users.username AS author_name,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'dev_log' AND post_id = dev_logs.id) AS like_count
         FROM dev_logs
         JOIN users ON users.id = dev_logs.author_user_id
         WHERE dev_logs.id = ?`
      )
      .bind(params.id)
      .first();
  } catch (e) {
    // Rollout compatibility if columns aren't migrated yet.
    try {
      log = await db
        .prepare(
          `SELECT dev_logs.id, dev_logs.author_user_id, dev_logs.title, dev_logs.body, dev_logs.image_key,
                  dev_logs.created_at, dev_logs.updated_at,
                  users.username AS author_name,
                  0 AS like_count
           FROM dev_logs
           JOIN users ON users.id = dev_logs.author_user_id
           WHERE dev_logs.id = ?`
        )
        .bind(params.id)
        .first();
      if (log) {
        log.is_locked = 0;
        log.moved_to_id = null;
        log.moved_to_type = null;
        log.github_url = null;
        log.demo_url = null;
        log.links = null;
      }
    } catch (e2) {
      dbUnavailable = true;
      log = null;
    }
  }

  if (dbUnavailable) {
    return (
      <section className="card">
        <h2 className="section-title">Development</h2>
        <p className="muted">
          Development is not enabled yet on this environment. Apply migrations 0010_devlog.sql, 0011_devlog_lock.sql, and
          0015_devlog_threaded_replies.sql.
        </p>
      </section>
    );
  }

  if (!log) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This dev log post does not exist.</p>
      </section>
    );
  }

  if (log.moved_to_id) {
    const to = destUrlFor(log.moved_to_type, log.moved_to_id);
    if (to) {
      redirect(to);
    }
  }

  let comments = [];
  try {
    const out = await db
      .prepare(
        `SELECT dev_log_comments.id, dev_log_comments.body, dev_log_comments.created_at, dev_log_comments.reply_to_id,
                users.username AS author_name
         FROM dev_log_comments
         JOIN users ON users.id = dev_log_comments.author_user_id
         WHERE dev_log_comments.log_id = ? AND dev_log_comments.is_deleted = 0
         ORDER BY dev_log_comments.created_at ASC`
      )
      .bind(params.id)
      .all();
    comments = out?.results || [];
  } catch (e) {
    comments = [];
  }

  const error = searchParams?.error;
  const notice =
    error === 'unauthorized'
      ? 'Only admins can post in Development.'
      : error === 'claim'
      ? 'Sign in before commenting.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'locked'
      ? 'Comments are locked on this post.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title and body are required.'
      : error === 'notfound'
      ? 'This dev log post does not exist.'
      : null;

  const commentNotice =
    error === 'missing'
      ? 'Comment text is required.'
      : error === 'locked'
      ? 'Comments are locked.'
      : error === 'notready'
      ? 'Replies are not enabled yet (database updates still applying).'
      : error === 'claim'
      ? 'Sign in before commenting.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : null;

  const canComment = !log.is_locked && !user.must_change_password && !!user.password_hash;
  const canEdit =
    !!user &&
    !user.must_change_password &&
    !!user.password_hash &&
    (isAdmin || user.id === log.author_user_id);
  
  // Check if current user has liked this log
  let userLiked = false;
  if (user) {
    try {
      const likeCheck = await db
        .prepare('SELECT id FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
        .bind('dev_log', log.id, user.id)
        .first();
      userLiked = !!likeCheck;
    } catch (e) {
      // Table might not exist yet
    }
  }

  const replyToId = String(searchParams?.replyTo || '').trim() || null;
  const replyingTo = replyToId ? comments.find((c) => c.id === replyToId) : null;
  const replyPrefill = replyingTo ? quoteMarkdown({ author: replyingTo.author_name, body: replyingTo.body }) : '';

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/devlog', label: 'Development' },
          { href: `/devlog/${log.id}`, label: log.title },
        ]}
      />

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h2 className="section-title" style={{ marginBottom: '8px' }}>{log.title}</h2>
            <div className="list-meta">
              <Username name={log.author_name} colorIndex={getUsernameColorIndex(log.author_name)} /> ·{' '}
              {new Date(log.created_at).toLocaleString()}
              {log.updated_at ? ` · Updated ${new Date(log.updated_at).toLocaleString()}` : null}
              {log.is_locked ? ' · Comments locked' : null}
            </div>
          </div>
          {user ? (
            <LikeButton 
              postType="dev_log" 
              postId={log.id} 
              initialLiked={userLiked}
              initialCount={Number(log.like_count || 0)}
            />
          ) : null}
        </div>
        {log.github_url || log.demo_url || log.links ? (
          <div className="project-links">
            {log.github_url ? (
              <a href={log.github_url} target="_blank" rel="noopener noreferrer" className="project-link">
                GitHub
              </a>
            ) : null}
            {log.demo_url ? (
              <a href={log.demo_url} target="_blank" rel="noopener noreferrer" className="project-link">
                Demo
              </a>
            ) : null}
            {parseLinksList(log.links).map((u) => (
              <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="project-link">
                Link
              </a>
            ))}
          </div>
        ) : null}
        {log.image_key ? (
          <img src={`/api/media/${log.image_key}`} alt="" className="post-image" loading="lazy" />
        ) : null}
        <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(log.body) }} />
      </section>

      {canEdit ? (
        <EditPostPanel buttonLabel="Edit Post" title="Edit Post">
          {notice ? <div className="notice">{notice}</div> : null}
          {isAdmin ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <form action={`/api/devlog/${log.id}/lock`} method="post">
                <input type="hidden" name="locked" value={log.is_locked ? '0' : '1'} />
                <button type="submit">{log.is_locked ? 'Unlock comments' : 'Lock comments'}</button>
              </form>
            </div>
          ) : null}
          <DevLogForm logId={log.id} initialData={log} />
        </EditPostPanel>
      ) : null}

      <section className="card">
        <h3 className="section-title">Replies</h3>
        {commentNotice ? <div className="notice">{commentNotice}</div> : null}
        {canComment ? (
          <form id="reply-form" action={`/api/devlog/${log.id}/comments`} method="post">
            <input type="hidden" name="reply_to_id" value={replyToId || ''} />
            <label>
              <div className="muted">{replyingTo ? `Replying to ${replyingTo.author_name}` : 'Add a reply'}</div>
              <textarea
                name="body"
                placeholder={replyingTo ? 'Write your reply…' : 'Write a reply…'}
                required
                defaultValue={replyPrefill}
              />
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit">Post reply</button>
              {replyingTo ? (
                <a className="project-link" href={`/devlog/${log.id}`}>
                  Cancel
                </a>
              ) : null}
            </div>
          </form>
        ) : (
          <p className="muted">
            {log.is_locked
              ? 'Comments are locked for this post.'
              : user.must_change_password || !user.password_hash
              ? 'Set your password to comment.'
              : 'Sign in to comment.'}
          </p>
        )}
        <div className="list">
          {comments.length === 0 ? (
            <p className="muted">No replies yet.</p>
          ) : (
            (() => {
              const byParent = new Map();
              for (const c of comments) {
                const key = c.reply_to_id || null;
                const arr = byParent.get(key) || [];
                arr.push(c);
                byParent.set(key, arr);
              }

              let lastName = null;
              let lastIndex = null;

              const renderReply = (c, { isChild }) => {
                const colorIndex = getUsernameColorIndex(c.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName
                });
                lastName = c.author_name;
                lastIndex = colorIndex;

                const replyLink = `/devlog/${log.id}?replyTo=${encodeURIComponent(c.id)}#reply-form`;
                return (
                  <div
                    key={c.id}
                    className={`list-item${isChild ? ' reply-item--child' : ''}`}
                    id={`reply-${c.id}`}
                  >
                    <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
                    <div
                      className="list-meta"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                    >
                      <span>
                        <Username name={c.author_name} colorIndex={colorIndex} />
                      </span>
                      <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <a className="post-link" href={replyLink}>
                          Reply
                        </a>
                        <span>{new Date(c.created_at).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                );
              };

              const top = byParent.get(null) || [];
              return top.map((c) => {
                const kids = byParent.get(c.id) || [];
                return (
                  <div key={`thread-${c.id}`} className="stack" style={{ gap: 10 }}>
                    {renderReply(c, { isChild: false })}
                    {kids.length ? (
                      <div className="reply-children">
                        {kids.map((child) => renderReply(child, { isChild: true }))}
                      </div>
                    ) : null}
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

