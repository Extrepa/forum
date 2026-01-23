import MusicClient from './MusicClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import { safeEmbedFromUrl } from '../../lib/embeds';
import { getSessionUser } from '../../lib/auth';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import MusicPostForm from '../../components/MusicPostForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MusicPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const db = await getDb();
  let results = [];
  try {
    const out = await db
      .prepare(
        `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
                music_posts.type, music_posts.tags, music_posts.image_key,
                music_posts.created_at,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                (SELECT COUNT(*) FROM music_comments WHERE post_id = music_posts.id) AS comment_count
         FROM music_posts
         JOIN users ON users.id = music_posts.author_user_id
         WHERE music_posts.moved_to_id IS NULL
         ORDER BY music_posts.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
                music_posts.type, music_posts.tags, music_posts.image_key,
                music_posts.created_at,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                (SELECT COUNT(*) FROM music_comments WHERE post_id = music_posts.id) AS comment_count
         FROM music_posts
         JOIN users ON users.id = music_posts.author_user_id
         ORDER BY music_posts.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  }
  
  // Set embed_style default (migration may not have run yet)
  for (const row of results) {
    row.embed_style = row.embed_style || 'auto';
  }

  // Pre-render markdown and embed info for server component
  const posts = results.map(row => ({
    ...row,
    bodyHtml: row.body ? renderMarkdown(row.body) : null,
    embed: safeEmbedFromUrl(row.type, row.url, row.embed_style || 'auto')
  }));

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Sign in before posting to the music feed.'
      : error === 'password'
      ? 'Set your password to continue posting.'
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

  const canCreate = !!user && !!user.password_hash;

  return (
    <>
      <PageTopRow
        items={[
          { href: '/', label: 'Home' },
          { href: '/music', label: 'Music' },
        ]}
        right={
          <NewPostModalButton label="New Music Post" title="Post to Music Feed" disabled={!canCreate} variant="wide">
            <MusicPostForm />
          </NewPostModalButton>
        }
      />
      <MusicClient posts={posts} notice={notice} />
    </>
  );
}
