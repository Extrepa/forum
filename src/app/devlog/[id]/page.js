import DevLogForm from '../../../components/DevLogForm';
import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { isAdminUser } from '../../../lib/admin';
import { getSessionUser } from '../../../lib/auth';
import PageTopRow from '../../../components/PageTopRow';
import Username from '../../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../../lib/usernameColor';
import EditPostButtonWithPanel from '../../../components/EditPostButtonWithPanel';
import DeletePostButton from '../../../components/DeletePostButton';
import LikeButton from '../../../components/LikeButton';
import ReplyFormWrapper from '../../../components/ReplyFormWrapper';
import PostHeader from '../../../components/PostHeader';
import ViewTracker from '../../../components/ViewTracker';
import CommentActions from '../../../components/CommentActions';

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
  // Next.js 15: params is a Promise, must await
  const { id } = await params;
  
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const isAdmin = isAdminUser(user);

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
                COALESCE(dev_logs.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'dev_log' AND post_id = dev_logs.id) AS like_count
         FROM dev_logs
         JOIN users ON users.id = dev_logs.author_user_id
         WHERE dev_logs.id = ? AND (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL)`
      )
      .bind(id)
      .first();
  } catch (e) {
    // Rollout compatibility if columns aren't migrated yet.
    try {
      log = await db
        .prepare(
          `SELECT dev_logs.id, dev_logs.author_user_id, dev_logs.title, dev_logs.body, dev_logs.image_key,
                  dev_logs.created_at, dev_logs.updated_at,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  0 AS like_count
           FROM dev_logs
           JOIN users ON users.id = dev_logs.author_user_id
           WHERE dev_logs.id = ? AND (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL)`
        )
        .bind(id)
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
      // Final fallback: remove is_deleted filter in case column doesn't exist
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
          .bind(id)
          .first();
        if (log) {
          log.is_locked = 0;
          log.moved_to_id = null;
          log.moved_to_type = null;
          log.github_url = null;
          log.demo_url = null;
          log.links = null;
        }
      } catch (e3) {
        dbUnavailable = true;
        log = null;
      }
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
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM dev_log_comments
         JOIN users ON users.id = dev_log_comments.author_user_id
         WHERE dev_log_comments.log_id = ? AND dev_log_comments.is_deleted = 0
         ORDER BY dev_log_comments.created_at ASC`
      )
      .bind(id)
      .all();
    comments = out?.results || [];
  } catch (e) {
    // Fallback if is_deleted column doesn't exist
    try {
      const out = await db
        .prepare(
          `SELECT dev_log_comments.id, dev_log_comments.body, dev_log_comments.created_at, dev_log_comments.reply_to_id,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference
           FROM dev_log_comments
           JOIN users ON users.id = dev_log_comments.author_user_id
           WHERE dev_log_comments.log_id = ?
           ORDER BY dev_log_comments.created_at ASC`
        )
        .bind(id)
        .all();
      comments = out?.results || [];
    } catch (e2) {
      comments = [];
    }
  }

  const error = searchParams?.error;
  const notice =
    error === 'unauthorized'
      ? 'Only admins can post in Development.'
      : error === 'claim'
      ? 'Log in to post.'
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
      ? 'Log in to post.'
      : null;

  const canComment = !log.is_locked && !!user && !!user.password_hash;
  const canEdit =
    !!user &&
    !!user.password_hash &&
    (isAdmin || user.id === log.author_user_id);
  const canDelete = canEdit;
  
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
  // Validate replyToId exists in comments before using
  const replyingTo = replyToId && comments.find((c) => c.id === replyToId) 
    ? { 
        id: comments.find((c) => c.id === replyToId).id,
        author_name: String(comments.find((c) => c.id === replyToId).author_name || ''),
        body: String(comments.find((c) => c.id === replyToId).body || '')
      }
    : null;
  const replyPrefill = replyingTo ? quoteMarkdown({ author: replyingTo.author_name, body: replyingTo.body }) : '';

  // Build preferences map and assign unique colors to all usernames on this page
  const allUsernames = [
    log.author_name,
    ...comments.map(c => c.author_name)
  ].filter(Boolean);
  
  // Build map of username -> preferred color index
  const preferredColors = new Map();
  if (log.author_name && log.author_color_preference !== null && log.author_color_preference !== undefined) {
    preferredColors.set(log.author_name, log.author_color_preference);
  }
  comments.forEach(c => {
    if (c.author_name && c.author_color_preference !== null && c.author_color_preference !== undefined) {
      preferredColors.set(c.author_name, c.author_color_preference);
    }
  });
  
  const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);

  return (
    <div className="stack">
      <PageTopRow
        items={[
          { href: '/', label: 'Home' },
          { href: '/devlog', label: 'Development' },
          { href: `/devlog/${id}`, label: log.title },
        ]}
        right={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isAdmin ? (
              <form action={`/api/devlog/${id}/lock`} method="post" style={{ margin: 0 }}>
                <input type="hidden" name="locked" value={log.is_locked ? '0' : '1'} />
                <button
                  type="submit"
                  className="button"
                  style={{
                    fontSize: '12px',
                    padding: '6px 10px',
                    minWidth: '90px',
                    minHeight: '44px',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1.2,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                    <span>{log.is_locked ? 'Unlock' : 'Lock'}</span>
                    <span style={{ whiteSpace: 'nowrap' }}>comments</span>
                  </span>
                </button>
              </form>
            ) : null}
            {canEdit ? (
              <>
                <EditPostButtonWithPanel 
                  buttonLabel="Edit Post" 
                  panelId="edit-devlog-panel"
                />
                {canDelete ? (
                  <DeletePostButton 
                    postId={id} 
                    postType="devlog"
                  />
                ) : null}
              </>
            ) : null}
          </div>
        }
      />

      <ViewTracker contentType="devlog" contentId={id} />
      
      <section className="card">
        <PostHeader
          title={log.title}
          author={log.author_name}
          authorColorIndex={usernameColorMap.get(log.author_name)}
          authorPreferredColorIndex={log.author_color_preference !== null && log.author_color_preference !== undefined ? log.author_color_preference : null}
          createdAt={log.created_at}
          likeButton={user ? (
            <LikeButton 
              postType="dev_log" 
              postId={id} 
              initialLiked={userLiked}
              initialCount={Number(log.like_count || 0)}
            />
          ) : null}
          showUpdatedAt={true}
          updatedAt={log.updated_at}
        />
        {log.is_locked ? (
          <span className="muted" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            Comments locked
          </span>
        ) : null}
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
        {log.views !== undefined && log.views !== null && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            fontSize: '12px',
            marginTop: '12px'
          }}>
            <span className="muted">
              {log.views} {log.views === 1 ? 'view' : 'views'}
            </span>
          </div>
        )}
      </section>

      {canEdit ? (
        <div id="edit-devlog-panel" style={{ display: 'none' }}>
          <section className="card">
            <h3 className="section-title">Edit Post</h3>
            {notice ? <div className="notice">{notice}</div> : null}
            <DevLogForm 
              logId={id} 
              initialData={{
                id: String(log.id || ''),
                title: String(log.title || ''),
                body: String(log.body || ''),
                image_key: log.image_key ? String(log.image_key) : null,
                github_url: log.github_url ? String(log.github_url) : null,
                demo_url: log.demo_url ? String(log.demo_url) : null,
                links: log.links ? String(log.links) : null,
                views: Number(log.views || 0),
                like_count: Number(log.like_count || 0),
                author_color_preference: log.author_color_preference !== null && log.author_color_preference !== undefined 
                  ? Number(log.author_color_preference) 
                  : null
              }} 
            />
          </section>
        </div>
      ) : null}

      <section className="card">
        <h3 className="section-title">Replies</h3>
        {commentNotice ? <div className="notice">{commentNotice}</div> : null}
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

              const renderReply = (c, { isChild }) => {
                const preferredColor = c.author_color_preference !== null && c.author_color_preference !== undefined ? c.author_color_preference : null;
                const colorIndex = usernameColorMap.get(c.author_name) ?? getUsernameColorIndex(c.author_name, { preferredColorIndex: preferredColor });

                const replyLink = `/devlog/${id}?replyTo=${encodeURIComponent(c.id)}#reply-form`;
                return (
                  <div
                    key={c.id}
                    className={`list-item${isChild ? ' reply-item--child' : ''}`}
                    id={`reply-${c.id}`}
                  >
                    <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
                    <div
                      className="list-meta"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: '12px' }}
                    >
                      <span>
                        <Username name={c.author_name} colorIndex={colorIndex} preferredColorIndex={preferredColor} />
                        {' · '}
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <CommentActions
                      commentId={c.id}
                      commentAuthor={c.author_name}
                      commentBody={c.body}
                      replyHref={replyLink}
                      onQuote={(quoteData) => {
                        // Could scroll to form and populate with quote
                        const quoteText = quoteMarkdown(quoteData);
                        // For now, just log - could be enhanced to populate form
                        console.log('Quote:', quoteText);
                      }}
                    />
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
        {canComment ? (
          <ReplyFormWrapper
            action={`/api/devlog/${id}/comments`}
            buttonLabel="Post reply"
            placeholder="Share your drip-certified thoughts..."
            labelText="What would you like to say?"
            hiddenFields={{ reply_to_id: replyToId || '' }}
            replyingTo={replyingTo}
            replyPrefill={replyPrefill}
          />
        ) : (
          <p className="muted">
            {log.is_locked
              ? 'Comments are locked for this post.'
              : !user
              ? 'Log in to post.'
              : null}
          </p>
        )}
      </section>
    </div>
  );
}

