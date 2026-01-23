import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { renderMarkdown } from '../../../lib/markdown';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Username from '../../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../../lib/usernameColor';
import LikeButton from '../../../components/LikeButton';
import PostHeader from '../../../components/PostHeader';
import ViewTracker from '../../../components/ViewTracker';
import CommentActions from '../../../components/CommentActions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LoreDetailPage({ params, searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }

  const db = await getDb();

  let post = null;
  let comments = [];
  let dbUnavailable = false;

  try {
    post = await db
      .prepare(
        `SELECT posts.id, posts.type, posts.title, posts.body, posts.image_key, posts.is_private,
                posts.created_at, posts.updated_at,
                COALESCE(posts.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'post' AND post_id = posts.id) AS like_count
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.id = ? AND posts.type = 'lore'`
      )
      .bind(params.id)
      .first();

    if (post) {
      const out = await db
        .prepare(
          `SELECT post_comments.id, post_comments.body, post_comments.created_at,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference
           FROM post_comments
           JOIN users ON users.id = post_comments.author_user_id
           WHERE post_comments.post_id = ?
             AND post_comments.is_deleted = 0
           ORDER BY post_comments.created_at ASC`
        )
        .bind(params.id)
        .all();
      comments = out?.results || [];
    }
  } catch (e) {
    dbUnavailable = true;
    post = null;
    comments = [];
  }

  if (dbUnavailable) {
    return (
      <section className="card">
        <h2 className="section-title">Lore</h2>
        <p className="muted">Lore is not available yet on this environment. Apply migration 0017_shared_posts.sql.</p>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This post does not exist.</p>
      </section>
    );
  }

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

  // Check if current user has liked this post
  let userLiked = false;
  let likeCount = 0;
  try {
    const likeCheck = await db
      .prepare('SELECT id FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
      .bind('post', post.id, user.id)
      .first();
    userLiked = !!likeCheck;
    likeCount = post.like_count || 0;
  } catch (e) {
    // Table might not exist yet
    likeCount = post.like_count || 0;
  }

  const error = searchParams?.error;
  const commentNotice =
    error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'missing'
      ? 'Comment text is required.'
      : error === 'notready'
      ? 'Comments are not enabled yet (database updates still applying).'
      : null;

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/lore', label: 'Lore' },
          { href: `/lore/${post.id}`, label: post.title || 'Untitled' },
        ]}
      />

      <ViewTracker contentType="posts" contentId={post.id} />
      
      <section className="card">
        <PostHeader
          title={post.title || 'Untitled'}
          author={post.author_name}
          authorColorIndex={usernameColorMap.get(post.author_name) ?? getUsernameColorIndex(post.author_name, { preferredColorIndex: post.author_color_preference !== null && post.author_color_preference !== undefined ? Number(post.author_color_preference) : null })}
          authorPreferredColorIndex={post.author_color_preference !== null && post.author_color_preference !== undefined ? Number(post.author_color_preference) : null}
          createdAt={post.created_at}
          views={post.views || 0}
          likeButton={
            <LikeButton 
              postType="post" 
              postId={post.id} 
              initialLiked={userLiked}
              initialCount={Number(likeCount)}
            />
          }
        />
        {post.is_private ? (
          <span className="muted" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            Members-only
          </span>
        ) : null}
        {post.body ? <div className="post-body" style={{ marginTop: '8px' }} dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} /> : null}
      </section>

      <section className="card">
        <h3 className="section-title">Comments</h3>
        {commentNotice ? <div className="notice">{commentNotice}</div> : null}
        <form action={`/api/posts/${post.id}/comments`} method="post">
          <label>
            <div className="muted">Say something</div>
            <textarea name="body" placeholder="Leave a comment" required />
          </label>
          <button type="submit">Post comment</button>
        </form>

        <div className="stack" style={{ marginTop: 16 }}>
          {comments.length === 0 ? (
            <p className="muted">No comments yet.</p>
          ) : (
            comments.map((c) => {
              const preferredColor = c.author_color_preference !== null && c.author_color_preference !== undefined ? Number(c.author_color_preference) : null;
              const colorIndex = usernameColorMap.get(c.author_name) ?? getUsernameColorIndex(c.author_name, { preferredColorIndex: preferredColor });
              return (
                <div key={c.id} className="reply-item">
                  <div className="reply-meta" style={{ fontSize: '12px' }}>
                    <Username 
                      name={c.author_name} 
                      colorIndex={colorIndex}
                      preferredColorIndex={preferredColor}
                    />
                    <span className="muted"> · {new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <div className="reply-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
                  <CommentActions
                    commentId={c.id}
                    commentAuthor={c.author_name}
                    commentBody={c.body}
                    replyHref={`/lore/${post.id}?replyTo=${encodeURIComponent(c.id)}#comment-form`}
                  />
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

