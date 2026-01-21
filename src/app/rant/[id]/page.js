import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { renderMarkdown } from '../../../lib/markdown';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Username from '../../../components/Username';
import { getUsernameColorIndex } from '../../../lib/usernameColor';

export const dynamic = 'force-dynamic';

export default async function RantDetailPage({ params, searchParams }) {
  const user = await getSessionUser();
  const isSignedIn = !!user;
  const db = await getDb();

  let post = null;
  let comments = [];
  let dbUnavailable = false;

  try {
    post = await db
      .prepare(
        `SELECT posts.id, posts.type, posts.title, posts.body, posts.image_key, posts.is_private,
                posts.created_at, posts.updated_at,
                users.username AS author_name
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.id = ? AND posts.type = 'rant'`
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
        <h2 className="section-title">Rant</h2>
        <p className="muted">Rant is not available yet on this environment. Apply migration 0017_shared_posts.sql.</p>
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

  const error = searchParams?.error;
  const commentNotice =
    error === 'claim'
      ? 'Sign in before commenting.'
      : error === 'password'
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
          { href: '/rant', label: 'Rant' },
          { href: `/rant/${post.id}`, label: post.title || 'Untitled' },
        ]}
      />

      <section className="card">
        <h2 className="section-title">{post.title || 'Untitled'}</h2>
        <div className="list-meta">
          <Username name={post.author_name} colorIndex={getUsernameColorIndex(post.author_name)} />
          <span className="muted"> · {new Date(post.created_at).toLocaleString()}</span>
          {post.is_private ? <span className="muted"> · Members-only</span> : null}
        </div>
        {post.body ? <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} /> : null}
      </section>

      <section className="card">
        <h3 className="section-title">Comments</h3>
        {commentNotice ? <div className="notice">{commentNotice}</div> : null}
        {isSignedIn ? (
          <form action={`/api/posts/${post.id}/comments`} method="post">
            <label>
              <div className="muted">Say something</div>
              <textarea name="body" placeholder="Leave a comment" required />
            </label>
            <button type="submit">Post comment</button>
          </form>
        ) : (
          <p className="muted">Sign in to comment.</p>
        )}

        <div className="stack" style={{ marginTop: 16 }}>
          {comments.length === 0 ? (
            <p className="muted">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="reply-item">
                <div className="reply-meta">
                  <Username name={c.author_name} colorIndex={getUsernameColorIndex(c.author_name)} />
                  <span className="muted"> · {new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div className="reply-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

