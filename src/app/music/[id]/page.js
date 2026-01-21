import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { safeEmbedFromUrl } from '../../../lib/embeds';
import { getSessionUser } from '../../../lib/auth';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Username from '../../../components/Username';
import { getUsernameColorIndex } from '../../../lib/usernameColor';
import LikeButton from '../../../components/LikeButton';

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
  const db = await getDb();
  let post = null;
  try {
    post = await db
      .prepare(
        `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
                music_posts.type, music_posts.tags, music_posts.image_key,
                music_posts.created_at, music_posts.embed_style,
                music_posts.moved_to_type, music_posts.moved_to_id,
                users.username AS author_name,
                (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'music_post' AND post_id = music_posts.id) AS like_count
         FROM music_posts
         JOIN users ON users.id = music_posts.author_user_id
         WHERE music_posts.id = ? AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)`
      )
      .bind(params.id)
      .first();
  } catch (e) {
    // Rollout compatibility if moved columns aren't migrated yet.
    try {
      post = await db
        .prepare(
          `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
                  music_posts.type, music_posts.tags, music_posts.image_key,
                  music_posts.created_at, users.username AS author_name,
                  (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                  (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                  0 AS like_count
           FROM music_posts
           JOIN users ON users.id = music_posts.author_user_id
           WHERE music_posts.id = ? AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)`
        )
        .bind(params.id)
        .first();
      if (post) {
        post.moved_to_id = null;
        post.moved_to_type = null;
        post.embed_style = null; // Will default to 'auto' in safeEmbedFromUrl
      }
    } catch (e2) {
      // Final fallback: remove is_deleted filter in case column doesn't exist
      try {
        post = await db
          .prepare(
            `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
                    music_posts.type, music_posts.tags, music_posts.image_key,
                    music_posts.created_at, users.username AS author_name,
                    (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                    (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                    0 AS like_count
             FROM music_posts
             JOIN users ON users.id = music_posts.author_user_id
             WHERE music_posts.id = ?`
          )
          .bind(params.id)
          .first();
        if (post) {
          post.moved_to_id = null;
          post.moved_to_type = null;
          post.embed_style = null;
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
                users.username AS author_name
         FROM music_comments
         JOIN users ON users.id = music_comments.author_user_id
         WHERE music_comments.post_id = ? AND music_comments.is_deleted = 0
         ORDER BY music_comments.created_at ASC`
      )
      .bind(params.id)
      .all();
    comments = result?.results || [];
  } catch (e) {
    // Fallback if is_deleted column doesn't exist
    try {
      const result = await db
        .prepare(
          `SELECT music_comments.id, music_comments.body, music_comments.created_at,
                  users.username AS author_name
           FROM music_comments
           JOIN users ON users.id = music_comments.author_user_id
           WHERE music_comments.post_id = ?
           ORDER BY music_comments.created_at ASC`
        )
        .bind(params.id)
        .all();
      comments = result?.results || [];
    } catch (e2) {
      comments = [];
    }
  }

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Sign in before rating or commenting.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'missing'
      ? 'Rating and comment text are required.'
      : error === 'invalid'
      ? 'Pick a rating between 1 and 5.'
      : null;

  const user = await getSessionUser();
  const embed = safeEmbedFromUrl(post.type, post.url, post.embed_style || 'auto');
  const tags = post.tags ? post.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
  
  // Check if current user has liked this post
  let userLiked = false;
  if (user) {
    try {
      const likeCheck = await db
        .prepare('SELECT id FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
        .bind('music_post', post.id, user.id)
        .first();
      userLiked = !!likeCheck;
    } catch (e) {
      // Table might not exist yet
    }
  }

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/music', label: 'Music' },
          { href: `/music/${post.id}`, label: post.title },
        ]}
      />
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h2 className="section-title" style={{ marginBottom: '8px' }}>{post.title}</h2>
            <div className="list-meta">
              <Username name={post.author_name} colorIndex={getUsernameColorIndex(post.author_name)} /> ·{' '}
              {new Date(post.created_at).toLocaleString()}
            </div>
          </div>
          {user ? (
            <LikeButton 
              postType="music_post" 
              postId={post.id} 
              initialLiked={userLiked}
              initialCount={Number(post.like_count || 0)}
            />
          ) : null}
        </div>
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
      </section>

      <section className="card">
        <div className="rating-comments-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: '12px' }}>Rate this</h3>
            {notice ? <div className="notice" style={{ marginBottom: '12px' }}>{notice}</div> : null}
            <form action="/api/music/ratings" method="post">
              <input type="hidden" name="post_id" value={post.id} />
              <label>
                <div className="muted">Your rating (1-5)</div>
                <select name="rating" defaultValue="5">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </label>
              <button type="submit">Submit rating</button>
            </form>
          </div>
          <div>
            <h3 className="section-title" style={{ marginBottom: '12px' }}>Comments</h3>
          </div>
        </div>
        <div className="list">
          {comments.length === 0 ? (
            <p className="muted">No comments yet.</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              return comments.map((comment) => {
                const colorIndex = getUsernameColorIndex(comment.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = comment.author_name;
                lastIndex = colorIndex;

                return (
                  <div key={comment.id} className="list-item">
                    <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.body) }} />
                    <div
                      className="list-meta"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>
                        <Username name={comment.author_name} colorIndex={colorIndex} />
                      </span>
                      <span>{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
        <form action="/api/music/comments" method="post">
          <input type="hidden" name="post_id" value={post.id} />
          <label>
            <div className="muted">Say something</div>
            <textarea name="body" placeholder="Leave a comment" required />
          </label>
          <button type="submit">Post comment</button>
        </form>
      </section>
    </div>
  );
}
