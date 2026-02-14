import DevLogForm from '../../../components/DevLogForm';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { formatDateTime } from '../../../lib/dates';
import { isAdminUser } from '../../../lib/admin';
import { getSessionUser } from '../../../lib/auth';
import PageTopRow from '../../../components/PageTopRow';
import PostActionMenu from '../../../components/PostActionMenu';
import Username from '../../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../../lib/usernameColor';
import DeletePostButton from '../../../components/DeletePostButton';
import HidePostButton from '../../../components/HidePostButton';
import PinPostButton from '../../../components/PinPostButton';
import LikeButton from '../../../components/LikeButton';
import ReplyFormWrapper from '../../../components/ReplyFormWrapper';
import PostHeader from '../../../components/PostHeader';
import ViewTracker from '../../../components/ViewTracker';
import ReplyButton from '../../../components/ReplyButton';
import DeleteCommentButton from '../../../components/DeleteCommentButton';

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
  // Next.js 15: params and searchParams are Promises, must await
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) || {};

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
                COALESCE(dev_logs.is_hidden, 0) AS is_hidden,
                COALESCE(dev_logs.is_pinned, 0) AS is_pinned,
                COALESCE(dev_logs.is_deleted, 0) AS is_deleted,
                dev_logs.created_at, dev_logs.updated_at,
                dev_logs.moved_to_type, dev_logs.moved_to_id,
                dev_logs.github_url, dev_logs.demo_url, dev_logs.links,
                COALESCE(dev_logs.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                users.avatar_key AS author_avatar_key,
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
                  users.avatar_key AS author_avatar_key,
                  COALESCE(dev_logs.is_hidden, 0) AS is_hidden,
                  COALESCE(dev_logs.is_pinned, 0) AS is_pinned,
                  COALESCE(dev_logs.is_deleted, 0) AS is_deleted,
                  0 AS like_count
           FROM dev_logs
           JOIN users ON users.id = dev_logs.author_user_id
           WHERE dev_logs.id = ? AND (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL)`
        )
        .bind(id)
        .first();
      if (log) {
        log.author_avatar_key = log.author_avatar_key || null;
        log.is_locked = 0;
        log.is_hidden = log.is_hidden ?? 0;
        log.is_pinned = log.is_pinned ?? 0;
        log.is_deleted = log.is_deleted ?? 0;
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
                    users.preferred_username_color_index AS author_color_preference,
                    users.avatar_key AS author_avatar_key,
                    0 AS is_hidden,
                    COALESCE(dev_logs.is_pinned, 0) AS is_pinned,
                    0 AS is_deleted,
                    0 AS like_count
             FROM dev_logs
             JOIN users ON users.id = dev_logs.author_user_id
             WHERE dev_logs.id = ?`
          )
          .bind(id)
          .first();
        if (log) {
          log.author_avatar_key = log.author_avatar_key || null;
          log.is_locked = 0;
          log.is_hidden = 0;
          log.is_pinned = log.is_pinned ?? 0;
          log.is_deleted = 0;
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
                dev_log_comments.author_user_id,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'dev_log_comment' AND post_id = dev_log_comments.id) AS like_count,
                (SELECT 1 FROM post_likes WHERE post_type = 'dev_log_comment' AND post_id = dev_log_comments.id AND user_id = ? LIMIT 1) AS liked
         FROM dev_log_comments
         JOIN users ON users.id = dev_log_comments.author_user_id
         WHERE dev_log_comments.log_id = ? AND dev_log_comments.is_deleted = 0
         ORDER BY dev_log_comments.created_at ASC`
      )
      .bind(user?.id || '', id)
      .all();
    comments = out?.results || [];
  } catch (e) {
    // Fallback if is_deleted column doesn't exist
    try {
      const out = await db
        .prepare(
          `SELECT dev_log_comments.id, dev_log_comments.body, dev_log_comments.created_at, dev_log_comments.reply_to_id,
                  dev_log_comments.author_user_id,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  (SELECT COUNT(*) FROM post_likes WHERE post_type = 'dev_log_comment' AND post_id = dev_log_comments.id) AS like_count,
                  (SELECT 1 FROM post_likes WHERE post_type = 'dev_log_comment' AND post_id = dev_log_comments.id AND user_id = ? LIMIT 1) AS liked
           FROM dev_log_comments
           JOIN users ON users.id = dev_log_comments.author_user_id
           WHERE dev_log_comments.log_id = ?
           ORDER BY dev_log_comments.created_at ASC`
        )
        .bind(user?.id || '', id)
        .all();
      comments = out?.results || [];
    } catch (e2) {
      comments = [];
    }
  }

  const error = resolvedSearchParams?.error;
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

  const isLocked = log.is_locked ? Boolean(log.is_locked) : false;
  const canComment = !isLocked && !!user && !!user.password_hash;
  const canEdit =
    !!user &&
    !!user.password_hash &&
    (isAdmin || user.id === log.author_user_id);
  const canDelete = canEdit;
  const canToggleLock = isAdmin;
  const isHidden = log.is_hidden ? Boolean(log.is_hidden) : false;
  const isPinned = log.is_pinned ? Boolean(log.is_pinned) : false;
  const isDeleted = log.is_deleted ? Boolean(log.is_deleted) : false;

  if (isDeleted) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This dev log post does not exist.</p>
      </section>
    );
  }

  if (isHidden && !canEdit) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This dev log post does not exist.</p>
      </section>
    );
  }
  
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

  const replyToId = String(resolvedSearchParams?.replyTo || '').trim() || null;

  // Serialize comments for client components and reply tree (avoid BigInt, ensure stable types)
  const safeComments = Array.isArray(comments)
    ? comments
        .filter((c) => c && c.id && c.body != null)
        .map((c) => {
          let bodyHtml = '';
          try {
            bodyHtml = renderMarkdown(String(c.body || ''));
          } catch (e) {
            bodyHtml = String(c.body || '').replace(/\n/g, '<br>');
          }
          return {
            id: String(c.id || ''),
            body: String(c.body || ''),
            body_html: bodyHtml,
            author_name: String(c.author_name || 'Unknown'),
            author_user_id: c.author_user_id != null ? String(c.author_user_id) : null,
            author_color_preference:
              c.author_color_preference != null && c.author_color_preference !== undefined
                ? Number(c.author_color_preference)
                : null,
            created_at: c.created_at != null ? Number(c.created_at) : 0,
            formattedDate: c.created_at ? formatDateTime(c.created_at) : '',
            reply_to_id: c.reply_to_id ? String(c.reply_to_id) : null,
          };
        })
    : [];

  const validCommentIds = new Set(safeComments.map((c) => c.id).filter(Boolean));
  const replyingTo = replyToId && validCommentIds.has(replyToId)
    ? (() => {
        const c = safeComments.find((x) => x.id === replyToId);
        return c ? { id: c.id, author_name: c.author_name, body: c.body } : null;
      })()
    : null;

  // Build preferences map and assign unique colors to all usernames on this page
  const allUsernames = [log.author_name, ...safeComments.map((c) => c.author_name)].filter(Boolean);
  const preferredColors = new Map();
  if (log.author_name && log.author_color_preference != null && log.author_color_preference !== undefined) {
    preferredColors.set(log.author_name, Number(log.author_color_preference));
  }
  safeComments.forEach((c) => {
    if (c.author_name && c.author_color_preference != null) {
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
          (isAdmin || canEdit) ? (
            <PostActionMenu
              buttonLabel="Edit Post"
              editModal={
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
              }
              rightChildren={canDelete ? (
                <DeletePostButton 
                  postId={id} 
                  postType="devlog"
                />
              ) : null}
            >
              {isAdmin ? <HidePostButton postId={id} postType="devlog" initialHidden={isHidden} /> : null}
              {isAdmin ? <PinPostButton postId={id} postType="devlog" initialPinned={isPinned} /> : null}
              {canToggleLock ? (
                <form action={`/api/devlog/${id}/lock`} method="post" style={{ margin: 0 }}>
                  <input type="hidden" name="locked" value={isLocked ? '0' : '1'} />
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
                      <span>{isLocked ? 'Unlock' : 'Lock'}</span>
                      <span style={{ whiteSpace: 'nowrap' }}>comments</span>
                    </span>
                  </button>
                </form>
              ) : null}
            </PostActionMenu>
          ) : null
        }
      />

      <ViewTracker contentType="devlog" contentId={id} />
      
      <section className="card">
        <PostHeader
          title={log.title}
          author={log.author_name}
          authorColorIndex={usernameColorMap.get(log.author_name)}
          authorPreferredColorIndex={log.author_color_preference !== null && log.author_color_preference !== undefined ? log.author_color_preference : null}
          authorAvatarKey={log.author_avatar_key}
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
        {isHidden ? (
          <span className="muted" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            Hidden
          </span>
        ) : null}
        {isLocked ? (
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
          <Image
            src={`/api/media/${log.image_key}`}
            alt=""
            className="post-image"
            width={1200}
            height={800}
            loading="lazy"
            unoptimized
          />
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

      <section className="card">
        <h3 className="section-title">Replies</h3>
        {commentNotice ? <div className="notice">{commentNotice}</div> : null}
        <div className="list">
          {safeComments.length === 0 ? (
            <p className="muted">No replies yet.</p>
          ) : (
            (() => {
              const byParent = new Map();
              for (const c of safeComments) {
                if (!c || !c.id) continue;
                const key = c.reply_to_id && validCommentIds.has(c.reply_to_id) ? c.reply_to_id : null;
                const arr = byParent.get(key) || [];
                arr.push(c);
                byParent.set(key, arr);
              }

              const renderReply = (c, { isChild }) => {
                if (!c || !c.id || c.body == null) return null;
                const preferredColor = c.author_color_preference != null ? Number(c.author_color_preference) : null;
                const colorIndex = usernameColorMap.get(c.author_name) ?? getUsernameColorIndex(c.author_name, { preferredColorIndex: preferredColor });
                const replyLink = `/devlog/${id}?replyTo=${encodeURIComponent(c.id)}#reply-form`;
                return (
                  <div
                    key={c.id}
                    className={`list-item comment-card${isChild ? ' reply-item--child' : ''}`}
                    id={`reply-${c.id}`}
                    style={{ position: 'relative' }}
                  >
                    <div className="reply-top-row">
                      <span className="reply-meta-inline">
                        <Username name={c.author_name} colorIndex={colorIndex} preferredColorIndex={preferredColor} />
                        {' · '}
                        <span suppressHydrationWarning>{c.formattedDate || ''}</span>
                      </span>
                      <div className="reply-actions-inline">
                        <ReplyButton
                          replyId={c.id}
                          replyAuthor={c.author_name}
                          replyHref={replyLink}
                        />
                        <LikeButton postType="dev_log_comment" postId={c.id} initialLiked={!!c.liked} initialCount={c.like_count || 0} size="sm" />
                        <DeleteCommentButton
                          inline
                          commentId={c.id}
                          parentId={id}
                          type="devlog"
                          authorUserId={c.author_user_id}
                          currentUserId={user?.id}
                          isAdmin={!!isAdmin}
                        />
                      </div>
                    </div>
                    <div className="post-body" dangerouslySetInnerHTML={{ __html: c.body_html || '' }} />
                  </div>
                );
              };

              const top = byParent.get(null) || [];
              return top.map((c) => {
                const kids = byParent.get(c.id) || [];
                const rendered = renderReply(c, { isChild: false });
                if (!rendered) return null;
                return (
                  <div key={`thread-${c.id}`} className="stack" style={{ gap: 10 }}>
                    {rendered}
                    {kids.length ? (
                      <div className="reply-children">
                        {kids.map((child) => renderReply(child, { isChild: true })).filter(Boolean)}
                      </div>
                    ) : null}
                  </div>
                );
              }).filter(Boolean);
            })()
          )}
        </div>
        {canComment ? (
          <div style={{ marginTop: '24px' }}>
            <ReplyFormWrapper
              action={`/api/devlog/${id}/comments`}
              buttonLabel="Post reply"
              placeholder="Share your drip-certified thoughts..."
              labelText="What would you like to say?"
              hiddenFields={{ reply_to_id: replyToId || '' }}
              replyingTo={replyingTo}
            />
          </div>
        ) : (
          <p className="muted">
            {isLocked
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
