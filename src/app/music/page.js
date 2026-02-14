import MusicClient from './MusicClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import { safeEmbedFromUrl } from '../../lib/embeds';
import { getSessionUser } from '../../lib/auth';
import { isAdminUser } from '../../lib/admin';
import NewPostModalButton from '../../components/NewPostModalButton';
import ShowHiddenToggleButton from '../../components/ShowHiddenToggleButton';
import MusicPostForm from '../../components/MusicPostForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MusicPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const isAdmin = isAdminUser(user);
  const showHidden = isAdmin && searchParams?.showHidden === '1';
  const db = await getDb();
  let results = [];
  const hiddenFilter = showHidden ? '' : 'AND (music_posts.is_hidden = 0 OR music_posts.is_hidden IS NULL)';
  try {
    const out = await db
      .prepare(
        `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
                music_posts.type, music_posts.tags, music_posts.image_key,
                music_posts.created_at,
                COALESCE(music_posts.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                (SELECT COUNT(*) FROM music_comments WHERE post_id = music_posts.id AND is_deleted = 0) AS comment_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'music_post' AND post_id = music_posts.id) AS like_count,
                COALESCE((SELECT MAX(created_at) FROM music_comments WHERE post_id = music_posts.id AND is_deleted = 0), music_posts.created_at) AS last_activity_at,
                COALESCE(music_posts.is_pinned, 0) AS is_pinned
         FROM music_posts
         JOIN users ON users.id = music_posts.author_user_id
         WHERE music_posts.moved_to_id IS NULL
           ${hiddenFilter}
           AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)
         ORDER BY is_pinned DESC, music_posts.created_at DESC
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
                COALESCE(music_posts.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT AVG(rating) FROM music_ratings WHERE post_id = music_posts.id) AS avg_rating,
                (SELECT COUNT(*) FROM music_ratings WHERE post_id = music_posts.id) AS rating_count,
                (SELECT COUNT(*) FROM music_comments WHERE post_id = music_posts.id AND is_deleted = 0) AS comment_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'music_post' AND post_id = music_posts.id) AS like_count,
                COALESCE((SELECT MAX(created_at) FROM music_comments WHERE post_id = music_posts.id AND is_deleted = 0), music_posts.created_at) AS last_activity_at,
                COALESCE(music_posts.is_pinned, 0) AS is_pinned
         FROM music_posts
         JOIN users ON users.id = music_posts.author_user_id
         ORDER BY is_pinned DESC, music_posts.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  }
  
  // Set embed_style default (migration may not have run yet)
  for (const row of results) {
    row.embed_style = row.embed_style || 'auto';
  }

  // Add unread status for logged-in users
  if (user && results.length > 0) {
    try {
      const postIds = results.map(p => p.id);
      if (postIds.length > 0) {
        const placeholders = postIds.map(() => '?').join(',');
        const readStates = await db
          .prepare(
            `SELECT content_id FROM content_reads 
             WHERE user_id = ? AND content_type = 'music_post' AND content_id IN (${placeholders})`
          )
          .bind(user.id, ...postIds)
          .all();

        const readSet = new Set();
        (readStates?.results || []).forEach(r => {
          readSet.add(r.content_id);
        });

        results.forEach(post => {
          post.is_unread = !readSet.has(post.id);
        });
      } else {
        results.forEach(post => {
          post.is_unread = false;
        });
      }
    } catch (e) {
      // content_reads table might not exist yet, mark all as read
      results.forEach(post => {
        post.is_unread = false;
      });
    }
  } else {
    results.forEach(post => {
      post.is_unread = false;
    });
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
      ? 'We only support YouTube, YouTube Music, SoundCloud, and Spotify links right now.'
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
      <MusicClient headerActions={
          <>
            {isAdmin ? <ShowHiddenToggleButton showHidden={showHidden} searchParams={searchParams} /> : null}
            <NewPostModalButton label="New Music Post" title="Post to Music Feed" disabled={!canCreate} variant="wide">
              <MusicPostForm />
            </NewPostModalButton>
          </>
        } posts={posts} notice={notice} />
    </>
  );
}
