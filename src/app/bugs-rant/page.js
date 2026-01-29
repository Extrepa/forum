import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { renderMarkdown } from '../../lib/markdown';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import GenericPostForm from '../../components/GenericPostForm';
import BugsRantClient from './BugsRantClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BugsRantPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const canCreate = !!user && !!user.password_hash;
  const db = await getDb();
  const isSignedIn = true; // Always true after redirect check

  let results = [];
  let dbUnavailable = false;
  try {
    const out = await db
      .prepare(
        `SELECT posts.id, posts.type, posts.title, posts.body, posts.image_key, posts.is_private, posts.created_at,
                COALESCE(posts.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id AND post_comments.is_deleted = 0) AS comment_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'post' AND post_id = posts.id) AS like_count,
                COALESCE((SELECT MAX(created_at) FROM post_comments WHERE post_id = posts.id AND is_deleted = 0), posts.created_at) AS last_activity_at
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.type IN ('bugs', 'rant')
           AND (posts.is_hidden = 0 OR posts.is_hidden IS NULL)
           AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL)
           AND (${isSignedIn ? '1=1' : 'posts.is_private = 0'})
         ORDER BY posts.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  } catch (e) {
    dbUnavailable = true;
    results = [];
  }

  const posts = results.map((row) => ({
    ...row,
    bodyHtml: row.body ? renderMarkdown(row.body) : null
  }));

  const error = searchParams?.error;
  const notice =
    dbUnavailable
      ? 'Bugs & Rants is not available yet on this environment. Apply migration 0017_shared_posts.sql.'
      : error === 'claim'
      ? 'Sign in before posting.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Text is required.'
      : error === 'notready'
      ? 'Bugs & Rants is not enabled yet (database updates still applying).'
      : null;

  return (
    <>
      <PageTopRow
        items={[{ href: '/', label: 'Home' }, { href: '/bugs-rant', label: 'Bugs & Rants' }]}
        right={
          <NewPostModalButton label="New Post" title="New Post" disabled={!canCreate} variant="wide">
            <GenericPostForm
              action="/api/posts"
              allowedTypes={['bugs', 'rant']}
              titleLabel="Title (optional)"
              titlePlaceholder="Short summary"
              bodyLabel="Details"
              bodyPlaceholder="What happened? What did you expect? Steps to reproduce? Screenshots/links?"
              buttonLabel="Post"
              showImage={true}
              requireImage={false}
              titleRequired={false}
              bodyRequired={true}
              showPrivateToggle={false}
            />
          </NewPostModalButton>
        }
      />
      <BugsRantClient posts={posts} notice={notice} />
    </>
  );
}
