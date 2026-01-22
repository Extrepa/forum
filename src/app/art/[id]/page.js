import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { renderMarkdown } from '../../../lib/markdown';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Username from '../../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../../lib/usernameColor';
import LikeButton from '../../../components/LikeButton';
import CommentFormWrapper from '../../../components/CommentFormWrapper';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ArtDetailPage({ params, searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const db = await getDb();
  const isSignedIn = true; // Always true after redirect check

  let post = null;
  let comments = [];
  let dbUnavailable = false;

  try {
    post = await db
      .prepare(
        `SELECT posts.id, posts.type, posts.title, posts.body, posts.image_key, posts.is_private,
                posts.created_at, posts.updated_at,
                users.username AS author_name,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'post' AND post_id = posts.id) AS like_count
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.id = ? AND posts.type = 'art'`
      )
      .bind(params.id)
      .first();

    if (post && (!isSignedIn && post.is_private)) {
      post = null;
    }

    if (post) {
      const out = await db
        .prepare(
          `SELECT post_comments.id, post_comments.body, post_comments.created_at,
                  users.username AS author_name
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
        <h2 className="section-title">Art</h2>
        <p className="muted">Art is not available yet on this environment. Apply migration 0017_shared_posts.sql.</p>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This post does not exist (or it is members-only).</p>
      </section>
    );
  }

  // Assign unique colors to all usernames on this page
  const allUsernames = [
    post.author_name,
    ...comments.map(c => c.author_name)
  ].filter(Boolean);
  const usernameColorMap = assignUniqueColorsForPage(allUsernames);

  // Check if current user has liked this post
  let userLiked = false;
  try {
    const likeCheck = await db
      .prepare('SELECT id FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
      .bind('post', post.id, user.id)
      .first();
    userLiked = !!likeCheck;
  } catch (e) {
    // Table might not exist yet
  }

  const error = searchParams?.error;
  const commentNotice =
    error === 'claim'
      ? 'Log in to post.'
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
          { href: '/art', label: 'Art' },
          { href: `/art/${post.id}`, label: post.title || 'Untitled' },
        ]}
      />

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h2 className="section-title" style={{ marginBottom: '8px' }}>{post.title || 'Untitled'}</h2>
            <div className="list-meta">
              <Username name={post.author_name} colorIndex={usernameColorMap.get(post.author_name)} />
              {post.is_private ? <span className="muted"> · Members-only</span> : null}
            </div>
          </div>
          <LikeButton 
            postType="post" 
            postId={post.id} 
            initialLiked={userLiked}
            initialCount={Number(post.like_count || 0)}
          />
        </div>
        {post.image_key ? <img src={`/api/media/${post.image_key}`} alt="" className="post-image" loading="lazy" /> : null}
        {post.body ? <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} /> : null}
      </section>

      <section className="card">
        <h3 className="section-title">Comments</h3>
        {commentNotice ? <div className="notice">{commentNotice}</div> : null}
        <CommentFormWrapper
          action={`/api/posts/${post.id}/comments`}
          buttonLabel="Post comment"
          placeholder="Drop your thoughts into the goo..."
          labelText="What would you like to say?"
        />

        <div className="stack" style={{ marginTop: 16 }}>
          {comments.length === 0 ? (
            <p className="muted">No comments yet.</p>
          ) : (
            comments.map((c) => {
              const colorIndex = usernameColorMap.get(c.author_name) ?? getUsernameColorIndex(c.author_name);
              return (
                <div key={c.id} className="reply-item">
                  <div className="reply-meta">
                    <Username name={c.author_name} colorIndex={colorIndex} />
                    <span className="muted"> · {new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <div className="reply-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

