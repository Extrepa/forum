import ProjectUpdateForm from '../../../components/ProjectUpdateForm';
import ProjectForm from '../../../components/ProjectForm';
import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Username from '../../../components/Username';
import { getUsernameColorIndex } from '../../../lib/usernameColor';

export const dynamic = 'force-dynamic';

function quoteMarkdown({ author, body }) {
  const safeAuthor = String(author || 'Someone').trim() || 'Someone';
  const text = String(body || '').trim();
  if (!text) return `> @${safeAuthor} said:\n>\n\n`;
  const lines = text.split('\n').slice(0, 8); // keep it short by default
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

export default async function ProjectDetailPage({ params, searchParams }) {
  const db = await getDb();
  let project = null;
  try {
    project = await db
      .prepare(
        `SELECT projects.id, projects.author_user_id, projects.title, projects.description, projects.status,
                projects.github_url, projects.demo_url, projects.image_key,
                projects.created_at, projects.updated_at,
                projects.moved_to_type, projects.moved_to_id,
                users.username AS author_name
         FROM projects
         JOIN users ON users.id = projects.author_user_id
         WHERE projects.id = ?`
      )
      .bind(params.id)
      .first();
  } catch (e) {
    // Rollout compatibility if moved columns aren't migrated yet.
    project = await db
      .prepare(
        `SELECT projects.id, projects.author_user_id, projects.title, projects.description, projects.status,
                projects.github_url, projects.demo_url, projects.image_key,
                projects.created_at, projects.updated_at,
                users.username AS author_name
         FROM projects
         JOIN users ON users.id = projects.author_user_id
         WHERE projects.id = ?`
      )
      .bind(params.id)
      .first();
    if (project) {
      project.moved_to_id = null;
      project.moved_to_type = null;
    }
  }

  if (!project) {
    return (
      <div className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This project does not exist.</p>
      </div>
    );
  }

  if (project.moved_to_id) {
    const to = destUrlFor(project.moved_to_type, project.moved_to_id);
    if (to) {
      redirect(to);
    }
  }

  const { results: updates } = await db
    .prepare(
      `SELECT project_updates.id, project_updates.title, project_updates.body,
              project_updates.image_key, project_updates.created_at,
              users.username AS author_name
       FROM project_updates
       JOIN users ON users.id = project_updates.author_user_id
       WHERE project_updates.project_id = ?
       ORDER BY project_updates.created_at DESC`
    )
    .bind(params.id)
    .all();

  // Project replies (forum-style). Rollout-safe: if table isn't migrated yet, fall back to none.
  let replies = [];
  let repliesEnabled = true;
  try {
    const out = await db
      .prepare(
        `SELECT project_replies.id, project_replies.body, project_replies.created_at, project_replies.reply_to_id,
                users.username AS author_name
         FROM project_replies
         JOIN users ON users.id = project_replies.author_user_id
         WHERE project_replies.project_id = ? AND project_replies.is_deleted = 0
         ORDER BY project_replies.created_at ASC`
      )
      .bind(params.id)
      .all();
    replies = out?.results || [];
  } catch (e) {
    replies = [];
    repliesEnabled = false;
  }

  const user = await getSessionUser();
  const canEdit =
    !!user &&
    !user.must_change_password &&
    !!user.password_hash &&
    user.id === project.author_user_id;

  const error = searchParams?.error;
  const editNotice =
    error === 'claim'
      ? 'Sign in before editing.'
      : error === 'password'
      ? 'Set your password to continue.'
      : error === 'unauthorized'
      ? 'Only the project author can edit this.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title, description, and status are required.'
      : error === 'notfound'
      ? 'This project does not exist.'
      : null;
  
  const updateNotice =
    error === 'claim'
      ? 'Sign in before posting.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'unauthorized'
      ? 'Only the project author can add updates.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title and body are required.'
      : error === 'notfound'
      ? 'This project does not exist.'
      : null;
  
  const commentNotice =
    error === 'claim'
      ? 'Sign in before commenting.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'notready'
      ? 'Replies are not enabled yet (database updates still applying).'
      : error === 'missing'
      ? 'Comment text is required.'
      : null;

  const replyToId = String(searchParams?.replyTo || '').trim() || null;
  const replyingTo = replyToId ? replies.find((r) => r.id === replyToId) : null;
  const replyPrefill = replyingTo ? quoteMarkdown({ author: replyingTo.author_name, body: replyingTo.body }) : '';

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/projects', label: 'Projects' },
          { href: `/projects/${project.id}`, label: project.title },
        ]}
      />
      <section className="card">
        <div className="post-header">
          <h2 className="section-title">{project.title}</h2>
          <span className={`status-badge status-${project.status}`}>{project.status}</span>
        </div>
        <div className="list-meta">
          <Username name={project.author_name} colorIndex={getUsernameColorIndex(project.author_name)} /> ·{' '}
          {new Date(project.created_at).toLocaleString()}
          {project.updated_at ? ` · Updated ${new Date(project.updated_at).toLocaleString()}` : null}
        </div>
        {project.image_key ? (
          <img
            src={`/api/media/${project.image_key}`}
            alt=""
            className="post-image"
            loading="lazy"
          />
        ) : null}
        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(project.description) }}
        />
        <div className="project-links">
          {project.github_url ? (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="project-link">
              GitHub
            </a>
          ) : null}
          {project.demo_url ? (
            <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="project-link">
              Demo
            </a>
          ) : null}
        </div>
      </section>

      {canEdit ? (
        <section className="card">
          <h3 className="section-title">Edit Project</h3>
          {editNotice ? <div className="notice">{editNotice}</div> : null}
          <ProjectForm projectId={project.id} initialData={project} />
        </section>
      ) : null}

      {canEdit ? (
        <section className="card">
          <h3 className="section-title">Add Update</h3>
          {updateNotice ? <div className="notice">{updateNotice}</div> : null}
          <ProjectUpdateForm projectId={project.id} />
        </section>
      ) : null}

      <section className="card">
        <h3 className="section-title">Updates</h3>
        <div className="list">
          {updates.length === 0 ? (
            <p className="muted">No updates yet.</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              return updates.map((update) => {
                const colorIndex = getUsernameColorIndex(update.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = update.author_name;
                lastIndex = colorIndex;

                return (
                  <div key={update.id} className="list-item">
                    <h4>{update.title}</h4>
                    {update.image_key ? (
                      <img
                        src={`/api/media/${update.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(update.body) }} />
                    <div className="list-meta">
                      <Username name={update.author_name} colorIndex={colorIndex} /> ·{' '}
                      {new Date(update.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Replies</h3>
        {commentNotice ? <div className="notice">{commentNotice}</div> : null}
        {repliesEnabled ? (
          <form id="reply-form" action={`/api/projects/${project.id}/replies`} method="post">
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
                <a className="project-link" href={`/projects/${project.id}`}>
                  Cancel
                </a>
              ) : null}
            </div>
          </form>
        ) : (
          <div className="muted" style={{ fontSize: 13 }}>
            Replies aren’t enabled yet (database updates still applying).
          </div>
        )}
        <div className="list">
          {replies.length === 0 ? (
            <p className="muted">No replies yet.</p>
          ) : (
            (() => {
              const byParent = new Map();
              for (const r of replies) {
                const key = r.reply_to_id || null;
                const arr = byParent.get(key) || [];
                arr.push(r);
                byParent.set(key, arr);
              }

              let lastName = null;
              let lastIndex = null;

              const renderReply = (r, { isChild }) => {
                const colorIndex = getUsernameColorIndex(r.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName
                });
                lastName = r.author_name;
                lastIndex = colorIndex;

                const replyLink = `/projects/${project.id}?replyTo=${encodeURIComponent(r.id)}#reply-form`;
                return (
                  <div
                    key={r.id}
                    className={`list-item${isChild ? ' reply-item--child' : ''}`}
                    id={`reply-${r.id}`}
                  >
                    <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(r.body) }} />
                    <div
                      className="list-meta"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                    >
                      <span>
                        <Username name={r.author_name} colorIndex={colorIndex} />
                      </span>
                      <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <a className="post-link" href={replyLink}>
                          Reply
                        </a>
                        <span>{new Date(r.created_at).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                );
              };

              const top = byParent.get(null) || [];
              return top.map((r) => {
                const kids = byParent.get(r.id) || [];
                return (
                  <div key={`thread-${r.id}`} className="stack" style={{ gap: 10 }}>
                    {renderReply(r, { isChild: false })}
                    {kids.length ? (
                      <div className="reply-children">
                        {kids.map((c) => renderReply(c, { isChild: true }))}
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
