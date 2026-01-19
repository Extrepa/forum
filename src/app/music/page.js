import MusicClient from './MusicClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import { safeEmbedFromUrl } from '../../lib/embeds';
import Breadcrumbs from '../../components/Breadcrumbs';

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

  // Pre-render markdown and embed info for server component
  const posts = results.map(row => ({
    ...row,
    bodyHtml: row.body ? renderMarkdown(row.body) : null,
    embed: safeEmbedFromUrl(row.type, row.url)
  }));

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
    <>
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/music', label: 'Music' },
        ]}
      />
      <MusicClient posts={posts} notice={notice} />
    </>
  );
}
