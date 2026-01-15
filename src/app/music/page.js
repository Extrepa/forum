import MusicPostForm from '../../components/MusicPostForm';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import { safeEmbedFromUrl } from '../../lib/embeds';

export const dynamic = 'force-dynamic';

export default async function MusicPage({ searchParams }) {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
              music_posts.type, music_posts.tags, music_posts.image_key,
              music_posts.created_at, users.username AS author_name,
              (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
              (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
              (SELECT COUNT(*) FROM music_comments WHERE post_id = music_posts.id) AS comment_count
       FROM music_posts
       JOIN users ON users.id = music_posts.author_user_id
       ORDER BY music_posts.created_at DESC
       LIMIT 50`
    )
    .all();

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Claim a username before posting to the music feed.'
      : error === 'invalid'
      ? 'We only support YouTube and SoundCloud links right now.'
      : error === 'missing'
      ? 'Title, type, and URL are required.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : null;

  return (
    <div className="stack">
      <section className="card">
        <h2 className="section-title">Friends Music</h2>
        <p className="muted">Drop tracks, rate them, and leave notes for the crew.</p>
        {notice ? <div className="notice">{notice}</div> : null}
        <MusicPostForm />
      </section>

      <section className="card">
        <h3 className="section-title">Latest Drops</h3>
        <div className="list">
          {results.length === 0 ? (
            <p className="muted">No music posts yet. Be the first to share a track.</p>
          ) : (
            results.map((row) => {
              const embed = safeEmbedFromUrl(row.type, row.url);
              const tags = row.tags ? row.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
              return (
                <div key={row.id} className="list-item">
                  <div className="post-header">
                    <h3>{row.title}</h3>
                    <a className="post-link" href={`/music/${row.id}`}>
                      View
                    </a>
                  </div>
                  <div className="list-meta">
                    {row.author_name} · {new Date(row.created_at).toLocaleString()}
                  </div>
                  {embed ? (
                    <div className={`embed-frame ${embed.aspect}`}>
                      <iframe
                        src={embed.src}
                        title={row.title}
                        allow={embed.allow}
                        allowFullScreen={embed.allowFullScreen}
                      />
                    </div>
                  ) : null}
                  {row.image_key ? (
                    <img
                      src={`/api/media/${row.image_key}`}
                      alt=""
                      className="post-image"
                      loading="lazy"
                    />
                  ) : null}
                  {row.body ? (
                    <div
                      className="post-body"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(row.body) }}
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
                    <span>Rating: {row.avg_rating ? Number(row.avg_rating).toFixed(1) : '—'}</span>
                    <span>{row.rating_count} votes</span>
                    <span>{row.comment_count} comments</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
