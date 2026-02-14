import Image from 'next/image';
import { redirect } from 'next/navigation';
import EditPostModal from '../../../components/EditPostModal';
import PostEditForm from '../../../components/PostEditForm';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { safeEmbedFromUrl } from '../../../lib/embeds';
import { getSessionUser } from '../../../lib/auth';
import { isAdminUser } from '../../../lib/admin';
import PageTopRow from '../../../components/PageTopRow';
import PostActionMenu from '../../../components/PostActionMenu';
import DeletePostButton from '../../../components/DeletePostButton';
import HidePostButton from '../../../components/HidePostButton';
import PinPostButton from '../../../components/PinPostButton';
import Username from '../../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../../lib/usernameColor';
import LikeButton from '../../../components/LikeButton';
import CommentFormWrapper from '../../../components/CommentFormWrapper';
import PostHeader from '../../../components/PostHeader';
import ViewTracker from '../../../components/ViewTracker';
import CommentActions from '../../../components/CommentActions';
import DeleteCommentButton from '../../../components/DeleteCommentButton';
import { formatDateTime } from '../../../lib/dates';

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

export default async function MusicDetailPage({ params, searchParams }) {
  // Next.js 15: params and searchParams are Promises, must await
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) || {};

  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const db = await getDb();
  let post = null;
  try {
    post = await db
      .prepare(
        `SELECT music_posts.id, music_posts.author_user_id, music_posts.title, music_posts.body, music_posts.url,
                music_posts.type, music_posts.tags, music_posts.image_key,
                music_posts.created_at, music_posts.moved_to_type, music_posts.moved_to_id,
                COALESCE(music_posts.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                users.avatar_key AS author_avatar_key,
                (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'music_post' AND post_id = music_posts.id) AS like_count,
                COALESCE(music_posts.is_locked, 0) AS is_locked,
                COALESCE(music_posts.is_hidden, 0) AS is_hidden,
                COALESCE(music_posts.is_pinned, 0) AS is_pinned,
                COALESCE(music_posts.is_deleted, 0) AS is_deleted,
                music_posts.embed_style
         FROM music_posts
         JOIN users ON users.id = music_posts.author_user_id
         WHERE music_posts.id = ? AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)`
      )
      .bind(id)
      .first();
    // Set embed_style default (migration may not have run yet) - preserve existing value if present
    if (post) {
      post.embed_style = post.embed_style || 'auto';
    }
  } catch (e) {
    // Rollout compatibility if moved columns aren't migrated yet.
    try {
      post = await db
        .prepare(
          `SELECT music_posts.id, music_posts.author_user_id, music_posts.title, music_posts.body, music_posts.url,
                  music_posts.type, music_posts.tags, music_posts.image_key,
                  music_posts.created_at, users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  users.avatar_key AS author_avatar_key,
                  (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                  (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                  0 AS like_count,
                  COALESCE(music_posts.is_locked, 0) AS is_locked,
                  COALESCE(music_posts.is_hidden, 0) AS is_hidden,
                  COALESCE(music_posts.is_pinned, 0) AS is_pinned,
                  COALESCE(music_posts.is_deleted, 0) AS is_deleted,
                  music_posts.embed_style
           FROM music_posts
           JOIN users ON users.id = music_posts.author_user_id
           WHERE music_posts.id = ? AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)`
        )
        .bind(id)
        .first();
        if (post) {
          post.author_avatar_key = post.author_avatar_key || null;
          post.moved_to_id = null;
          post.moved_to_type = null;
          post.embed_style = post.embed_style || 'auto'; // Preserve existing value or default to 'auto'
          post.is_locked = post.is_locked ?? 0;
          post.is_hidden = post.is_hidden ?? 0;
          post.is_pinned = post.is_pinned ?? 0;
          post.is_deleted = post.is_deleted ?? 0;
        }
    } catch (e2) {
      // Final fallback: remove is_deleted filter in case column doesn't exist
      try {
        post = await db
          .prepare(
            `SELECT music_posts.id, music_posts.author_user_id, music_posts.title, music_posts.body, music_posts.url,
                    music_posts.type, music_posts.tags, music_posts.image_key,
                    music_posts.created_at, users.username AS author_name,
                    users.preferred_username_color_index AS author_color_preference,
                    users.avatar_key AS author_avatar_key,
                    (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                    (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                    0 AS like_count,
                    0 AS is_locked,
                    0 AS is_hidden,
                    COALESCE(music_posts.is_pinned, 0) AS is_pinned,
                    0 AS is_deleted,
                    music_posts.embed_style
             FROM music_posts
             JOIN users ON users.id = music_posts.author_user_id
             WHERE music_posts.id = ?`
          )
          .bind(id)
          .first();
        if (post) {
          post.author_avatar_key = post.author_avatar_key || null;
          post.moved_to_id = null;
          post.moved_to_type = null;
          post.embed_style = post.embed_style || 'auto'; // Preserve existing value or default to 'auto'
          post.is_locked = 0;
          post.is_hidden = 0;
          post.is_pinned = post.is_pinned ?? 0;
          post.is_deleted = 0;
        }
      } catch (e3) {
        post = null;
      }
    }
  }

  if (!post) {
    return (
      <div className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This music post does not exist.</p>
      </div>
    );
  }

  if (post.moved_to_id) {
    const to = destUrlFor(post.moved_to_type, post.moved_to_id);
    if (to) {
      redirect(to);
    }
  }

  let comments = [];
  try {
    const result = await db
      .prepare(
        `SELECT music_comments.id, music_comments.body, music_comments.created_at,
                music_comments.author_user_id,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'music_comment' AND post_id = music_comments.id) AS like_count,
                (SELECT 1 FROM post_likes WHERE post_type = 'music_comment' AND post_id = music_comments.id AND user_id = ? LIMIT 1) AS liked
         FROM music_comments
         JOIN users ON users.id = music_comments.author_user_id
         WHERE music_comments.post_id = ? AND music_comments.is_deleted = 0
         ORDER BY music_comments.created_at ASC`
      )
      .bind(user?.id || '', id)
      .all();
    comments = result?.results || [];
  } catch (e) {
    // Fallback if is_deleted column doesn't exist
    try {
      const result = await db
        .prepare(
          `SELECT music_comments.id, music_comments.body, music_comments.created_at,
                  music_comments.author_user_id,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  (SELECT COUNT(*) FROM post_likes WHERE post_type = 'music_comment' AND post_id = music_comments.id) AS like_count,
                  (SELECT 1 FROM post_likes WHERE post_type = 'music_comment' AND post_id = music_comments.id AND user_id = ? LIMIT 1) AS liked
           FROM music_comments
           JOIN users ON users.id = music_comments.author_user_id
           WHERE music_comments.post_id = ?
           ORDER BY music_comments.created_at ASC`
        )
        .bind(user?.id || '', id)
        .all();
      comments = result?.results || [];
    } catch (e2) {
      comments = [];
    }
  }

  const error = resolvedSearchParams?.error;
  const notice =
    error === 'claim'
      ? 'Log in to post.'
      : error === 'locked'
      ? 'Comments are locked on this post.'
      : error === 'missing'
      ? 'Rating and comment text are required.'
      : error === 'invalid'
      ? 'Pick a rating between 1 and 5.'
      : null;

  const isAdmin = isAdminUser(user);
  const canEdit = !!user && !!user.password_hash && (user.id === post.author_user_id || isAdmin);
  const canDelete = canEdit;
  const canToggleLock = isAdmin;
  const isLocked = post.is_locked ? Boolean(post.is_locked) : false;
  const isHidden = post.is_hidden ? Boolean(post.is_hidden) : false;
  const isPinned = post.is_pinned ? Boolean(post.is_pinned) : false;
  const isDeleted = post.is_deleted ? Boolean(post.is_deleted) : false;

  if (isDeleted) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This music post does not exist.</p>
      </section>
    );
  }

  if (isHidden && !canEdit) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This music post does not exist.</p>
      </section>
    );
  }
  const embed = safeEmbedFromUrl(post.type, post.url, post.embed_style || 'auto');
  const tags = post.tags ? post.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
  
  // Build preferences map and assign unique colors to all usernames on this page
  const allUsernames = [
    post.author_name,
    ...comments.map(c => c.author_name)
  ].filter(Boolean);
  
  // Build map of username -> preferred color index
  const preferredColors = new Map();
  if (post.author_name && post.author_color_preference !== null && post.author_color_preference !== undefined) {
    preferredColors.set(post.author_name, Number(post.author_color_preference));
  }
  comments.forEach(c => {
    if (c.author_name && c.author_color_preference !== null && c.author_color_preference !== undefined) {
      preferredColors.set(c.author_name, Number(c.author_color_preference));
    }
  });
  
  const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);

  // Serialize comments for client-safe rendering (avoid BigInt, pre-render markdown)
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
            author_color_preference: c.author_color_preference != null && c.author_color_preference !== undefined ? Number(c.author_color_preference) : null,
            created_at: c.created_at != null ? Number(c.created_at) : 0,
            formattedDate: c.created_at ? formatDateTime(c.created_at) : '',
          };
        })
    : [];
  
  // Check if current user has liked this post
  let userLiked = false;
  if (user) {
    try {
      const likeCheck = await db
        .prepare('SELECT id FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
        .bind('music_post', id, user.id)
        .first();
      userLiked = !!likeCheck;
    } catch (e) {
      // Table might not exist yet
    }
  }

  return (
    <div className="stack">
      <PageTopRow
        items={[
          { href: '/', label: 'Home' },
          { href: '/music', label: 'Music' },
          { href: `/music/${id}`, label: post.title },
        ]}
        right={
          (isAdmin || canEdit) ? (
            <PostActionMenu
              buttonLabel="Edit Post"
              editModal={
                <section className="card">
                  <h3 className="section-title">Edit Post</h3>
                  {resolvedSearchParams?.error === 'claim'
                    ? <div className="notice">Log in to post.</div>
                    : resolvedSearchParams?.error === 'unauthorized'
                    ? <div className="notice">Only the post author can edit this.</div>
                    : resolvedSearchParams?.error === 'upload'
                    ? <div className="notice">Image upload is not allowed for this username.</div>
                    : resolvedSearchParams?.error === 'too_large'
                    ? <div className="notice">Image is too large (max 5MB).</div>
                    : resolvedSearchParams?.error === 'invalid_type'
                    ? <div className="notice">Only image files are allowed.</div>
                    : resolvedSearchParams?.error === 'missing'
                    ? <div className="notice">Title and body are required.</div>
                    : null}
                  <PostEditForm
                    action={`/api/music/${id}`}
                    initialData={{
                      title: String(post.title || ''),
                      body: String(post.body || ''),
                      url: String(post.url || ''),
                      type: String(post.type || ''),
                      tags: String(post.tags || ''),
                      image_key: post.image_key ? String(post.image_key) : null,
                      embed_style: String(post.embed_style || 'auto')
                    }}
                    titleLabel="Title"
                    bodyLabel="Body"
                    showImage={true}
                  />
                </section>
              }
              rightChildren={canDelete ? (
                <DeletePostButton 
                  postId={id} 
                  postType="music"
                  iconOnly={true}
                />
              ) : null}
            >
              {isAdmin ? <HidePostButton postId={id} postType="music" initialHidden={isHidden} /> : null}
              {isAdmin ? <PinPostButton postId={id} postType="music" initialPinned={isPinned} /> : null}
              {canToggleLock ? (
                <form action={`/api/music/${id}/lock`} method="post" style={{ margin: 0 }}>
                  <input type="hidden" name="locked" value={isLocked ? '0' : '1'} />
                  <button
                    type="submit"
                    className={`button button--icon-only ${isLocked ? 'is-active' : ''}`}
                    title={isLocked ? 'Unlock comments' : 'Lock comments'}
                    aria-label={isLocked ? 'Unlock comments' : 'Lock comments'}
                  >
                    {isLocked ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                      </svg>
                    )}
                    <span className="sr-only">{isLocked ? 'Unlock comments' : 'Lock comments'}</span>
                  </button>
                </form>
              ) : null}
            </PostActionMenu>
          ) : null
        }
      />
      <ViewTracker contentType="music" contentId={id} />
      
      <section className="card">
        <PostHeader
          title={post.title}
          author={post.author_name}
          authorColorIndex={usernameColorMap.get(post.author_name)}
          authorPreferredColorIndex={post.author_color_preference !== null && post.author_color_preference !== undefined ? Number(post.author_color_preference) : null}
          authorAvatarKey={post.author_avatar_key}
          createdAt={post.created_at}
          likeButton={user ? (
            <LikeButton 
              postType="music_post" 
              postId={post.id} 
              initialLiked={userLiked}
              initialCount={Number(post.like_count || 0)}
            />
          ) : null}
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
        {embed ? (
          <div 
            className={`embed-frame ${embed.aspect}`}
            style={{
              ...(embed.height ? { height: `${embed.height}px`, minHeight: `${embed.height}px` } : {})
            }}
          >
            <iframe
              src={embed.src}
              title={post.title}
              allow={embed.allow}
              allowFullScreen={embed.allowFullScreen}
              style={{ height: '100%' }}
            />
          </div>
        ) : null}
        {post.image_key ? (
          <Image
            src={`/api/media/${post.image_key}`}
            alt=""
            className="post-image"
            width={1200}
            height={800}
            unoptimized
          />
        ) : null}
        {post.body ? (
          <div
            className="post-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
          />
        ) : null}
        {tags.length ? (
          <div className="tag-row">
            {tags.map((tag) => (
              <span key={tag} className="tag-pill">{tag}</span>
            ))}
          </div>
        ) : null}
        <div className="rating-row">
          <span>Rating: {post.avg_rating ? Number(post.avg_rating).toFixed(1) : '—'}</span>
          <span>{post.rating_count} votes</span>
        </div>
        {post.views !== undefined && post.views !== null && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            fontSize: '12px',
            marginTop: '12px'
          }}>
            <span className="muted">
              {post.views} {post.views === 1 ? 'view' : 'views'}
            </span>
          </div>
        )}
      </section>

      {/* Rating Section - Separate skinny card */}
      <section className="card">
        {notice ? <div className="notice" style={{ marginBottom: '12px' }}>{notice}</div> : null}
        <form action="/api/music/ratings" method="post" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="hidden" name="post_id" value={id} />
          <h3 className="section-title" style={{ margin: 0, flexShrink: 0 }}>Rate this</h3>
          <label style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <div className="muted">Your rating (1-5)</div>
            <select name="rating" defaultValue="5" style={{ width: '100%' }}>
              <option value="1">1 - I didn&apos;t have time to listen</option>
              <option value="2">2 - I&apos;m not really my style</option>
              <option value="3">3 - I vibe with it</option>
              <option value="4">4 - I love it</option>
              <option value="5">5 - This is my new personality</option>
            </select>
          </label>
          <button type="submit" style={{ flexShrink: 0, maxWidth: '60px', whiteSpace: 'normal', lineHeight: '1.2', padding: '6px 10px', fontSize: '13px' }}>Submit rating</button>
        </form>
      </section>

      {/* Comments Section */}
      <section className="card">
        <h3 className="section-title" style={{ marginBottom: '12px' }}>Comments</h3>
        <div className="list">
          {safeComments.length === 0 ? (
            <p className="muted">No comments yet.</p>
          ) : (
            safeComments.map((comment) => {
              const preferredColor = comment.author_color_preference != null ? Number(comment.author_color_preference) : null;
              const colorIndex = usernameColorMap.get(comment.author_name) ?? getUsernameColorIndex(comment.author_name, { preferredColorIndex: preferredColor });
              return (
                <div key={comment.id} className="list-item comment-card" style={{ position: 'relative' }}>
                  <div className="comment-action-row">
                    <LikeButton postType="music_comment" postId={comment.id} initialLiked={!!comment.liked} initialCount={comment.like_count || 0} size="sm" />
                    <DeleteCommentButton
                      inline
                      commentId={comment.id}
                      parentId={id}
                      type="music"
                      authorUserId={comment.author_user_id}
                      currentUserId={user?.id}
                      isAdmin={!!isAdmin}
                    />
                  </div>
                  <div className="post-body" dangerouslySetInnerHTML={{ __html: comment.body_html || '' }} />
                  <div
                    className="list-meta"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}
                  >
                    <span>
                      <Username name={comment.author_name} colorIndex={colorIndex} preferredColorIndex={preferredColor} />
                      {' · '}
                      <span suppressHydrationWarning>{comment.formattedDate || ''}</span>
                    </span>
                  </div>
                  <CommentActions
                    commentId={comment.id}
                    commentAuthor={comment.author_name}
                    commentBody={comment.body}
                    replyHref={`/music/${id}?replyTo=${encodeURIComponent(comment.id)}#comment-form`}
                  />
                </div>
              );
            })
          )}
        </div>
        {isLocked ? (
          <p className="muted" style={{ marginTop: '12px' }}>Comments are locked for this post.</p>
        ) : (
          <div style={{ marginTop: '12px' }}>
            <CommentFormWrapper
              action="/api/music/comments"
              buttonLabel="Post comment"
              placeholder="Drop your thoughts into the goo..."
              labelText="What would you like to say?"
              hiddenFields={{ post_id: id }}
              notice={notice}
            />
          </div>
        )}
      </section>
    </div>
  );
}
