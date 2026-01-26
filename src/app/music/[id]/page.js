import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { safeEmbedFromUrl } from '../../../lib/embeds';
import { getSessionUser } from '../../../lib/auth';
import { isAdminUser } from '../../../lib/admin';
import PageTopRow from '../../../components/PageTopRow';
import EditPostButtonWithPanel from '../../../components/EditPostButtonWithPanel';
import DeletePostButton from '../../../components/DeletePostButton';
import Username from '../../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../../lib/usernameColor';
import LikeButton from '../../../components/LikeButton';
import CommentFormWrapper from '../../../components/CommentFormWrapper';
import PostHeader from '../../../components/PostHeader';
import ViewTracker from '../../../components/ViewTracker';
import CommentActions from '../../../components/CommentActions';
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
                (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'music_post' AND post_id = music_posts.id) AS like_count,
                COALESCE(music_posts.is_locked, 0) AS is_locked,
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
                  (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                  (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                  0 AS like_count,
                  COALESCE(music_posts.is_locked, 0) AS is_locked,
                  music_posts.embed_style
           FROM music_posts
           JOIN users ON users.id = music_posts.author_user_id
           WHERE music_posts.id = ? AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)`
        )
        .bind(id)
        .first();
      if (post) {
        post.moved_to_id = null;
        post.moved_to_type = null;
        post.embed_style = post.embed_style || 'auto'; // Preserve existing value or default to 'auto'
        post.is_locked = post.is_locked ?? 0;
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
                    (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                    (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                    0 AS like_count,
                    0 AS is_locked,
                    music_posts.embed_style
             FROM music_posts
             JOIN users ON users.id = music_posts.author_user_id
             WHERE music_posts.id = ?`
          )
          .bind(id)
          .first();
        if (post) {
          post.moved_to_id = null;
          post.moved_to_type = null;
          post.embed_style = post.embed_style || 'auto'; // Preserve existing value or default to 'auto'
          post.is_locked = 0;
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
                users.preferred_username_color_index AS author_color_preference
         FROM music_comments
         JOIN users ON users.id = music_comments.author_user_id
         WHERE music_comments.post_id = ? AND music_comments.is_deleted = 0
         ORDER BY music_comments.created_at ASC`
      )
      .bind(id)
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
                  users.preferred_username_color_index AS author_color_preference
           FROM music_comments
           JOIN users ON users.id = music_comments.author_user_id
           WHERE music_comments.post_id = ?
           ORDER BY music_comments.created_at ASC`
        )
        .bind(id)
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isAdmin ? (
              <form action={`/api/music/${id}/lock`} method="post" style={{ margin: 0 }}>
                <input type="hidden" name="locked" value={post.is_locked ? '0' : '1'} />
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
                    <span>{post.is_locked ? 'Unlock' : 'Lock'}</span>
                    <span style={{ whiteSpace: 'nowrap' }}>comments</span>
                  </span>
                </button>
              </form>
            ) : null}
            {canEdit ? (
              <>
                <EditPostButtonWithPanel 
                  buttonLabel="Edit Post" 
                  panelId="edit-music-panel"
                />
                {canDelete ? (
                  <DeletePostButton 
                    postId={id} 
                    postType="music_post"
                  />
                ) : null}
              </>
            ) : null}
          </div>
        }
      />
      <ViewTracker contentType="music" contentId={id} />
      
      <section className="card">
        <PostHeader
          title={post.title}
          author={post.author_name}
          authorColorIndex={usernameColorMap.get(post.author_name)}
          authorPreferredColorIndex={post.author_color_preference !== null && post.author_color_preference !== undefined ? Number(post.author_color_preference) : null}
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
        {post.is_locked ? (
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
          <img src={`/api/media/${post.image_key}`} alt="" className="post-image" />
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
              <option value="1">1 - I didn't have time to listen</option>
              <option value="2">2 - I'm not really my style</option>
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
                <div key={comment.id} className="list-item" style={{ position: 'relative' }}>
                  <DeleteCommentButton
                    commentId={comment.id}
                    parentId={id}
                    type="music"
                    authorUserId={comment.author_user_id}
                    currentUserId={user?.id}
                    isAdmin={!!isAdmin}
                  />
                  <div className="post-body" dangerouslySetInnerHTML={{ __html: comment.body_html || '' }} />
                  <div
                    className="list-meta"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}
                  >
                    <span>
                      <Username name={comment.author_name} colorIndex={colorIndex} preferredColorIndex={preferredColor} />
                      {' · '}
                      {comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}
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
        {post.is_locked ? (
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
