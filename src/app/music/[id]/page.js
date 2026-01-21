import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { safeEmbedFromUrl } from '../../../lib/embeds';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Username from '../../../components/Username';
import { getUsernameColorIndex } from '../../../lib/usernameColor';

export const dynamic = 'force-dynamic';

export default async function MusicDetailPage({ params, searchParams }) {
  const db = await getDb();
  const post = await db
    .prepare(
      `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
              music_posts.type, music_posts.tags, music_posts.image_key,
              music_posts.created_at, users.username AS author_name,
              (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
              (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count
       FROM music_posts
       JOIN users ON users.id = music_posts.author_user_id
       WHERE music_posts.id = ?`
    )
    .bind(params.id)
    .first();

  if (!post) {
    return (
      <div className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This music post does not exist.</p>
      </div>
    );
  }

  const { results: comments } = await db
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

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Sign in before rating or commenting.'
      : error === 'password'
      ? 'Change your password to continue posting.'
      : error === 'missing'
      ? 'Rating and comment text are required.'
      : error === 'invalid'
      ? 'Pick a rating between 1 and 5.'
      : null;

  const embed = safeEmbedFromUrl(post.type, post.url);
  const tags = post.tags ? post.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];

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
        <h2 className="section-title">{post.title}</h2>
        <div className="list-meta">
          <Username name={post.author_name} colorIndex={getUsernameColorIndex(post.author_name)} /> ·{' '}
          {new Date(post.created_at).toLocaleString()}
        </div>
        {embed ? (
          <div className={`embed-frame ${embed.aspect}`}>
            <iframe
              src={embed.src}
              title={post.title}
              allow={embed.allow}
              allowFullScreen={embed.allowFullScreen}
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
        <h3 className="section-title">Rate this</h3>
        {notice ? <div className="notice">{notice}</div> : null}
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
      </section>

      <section className="card">
        <h3 className="section-title">Comments</h3>
        <form action="/api/music/comments" method="post">
          <input type="hidden" name="post_id" value={post.id} />
          <label>
            <div className="muted">Say something</div>
            <textarea name="body" placeholder="Leave a comment" required />
          </label>
          <button type="submit">Post comment</button>
        </form>
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
      </section>
    </div>
  );
}
