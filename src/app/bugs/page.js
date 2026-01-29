import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { renderMarkdown } from '../../lib/markdown';
import { isAdminUser } from '../../lib/admin';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import ShowHiddenToggleButton from '../../components/ShowHiddenToggleButton';
import GenericPostForm from '../../components/GenericPostForm';
import BugsClient from './BugsClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BugsPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const isAdmin = isAdminUser(user);
  const showHidden = isAdmin && searchParams?.showHidden === '1';
  const canCreate = !!user && !!user.password_hash;
  const db = await getDb();
  const isSignedIn = true; // Always true after redirect check

  let results = [];
  let dbUnavailable = false;
  const hiddenFilter = showHidden ? '' : 'AND (posts.is_hidden = 0 OR posts.is_hidden IS NULL)';
  try {
    const out = await db
      .prepare(
        `SELECT posts.id, posts.title, posts.body, posts.image_key, posts.is_private, posts.created_at,
                COALESCE(posts.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id AND post_comments.is_deleted = 0) AS comment_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'post' AND post_id = posts.id) AS like_count,
                COALESCE((SELECT MAX(created_at) FROM post_comments WHERE post_id = posts.id AND is_deleted = 0), posts.created_at) AS last_activity_at
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.type = 'bugs'
           ${hiddenFilter}
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

  // Add unread status for logged-in users
  if (user && results.length > 0) {
    try {
      const postIds = results.map(p => p.id);
      if (postIds.length > 0) {
        const placeholders = postIds.map(() => '?').join(',');
        const readStates = await db
          .prepare(
            `SELECT content_id FROM content_reads 
             WHERE user_id = ? AND content_type = 'post' AND content_id IN (${placeholders})`
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

  const posts = results.map((row) => ({
    ...row,
    bodyHtml: row.body ? renderMarkdown(row.body) : null
  }));

  const error = searchParams?.error;
  const notice =
    dbUnavailable
      ? 'Bugs is not available yet on this environment. Apply migration 0017_shared_posts.sql.'
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
      ? 'Bug report text is required.'
      : error === 'notready'
      ? 'Bugs is not enabled yet (database updates still applying).'
      : null;

  return (
    <>
      <PageTopRow
        items={[{ href: '/', label: 'Home' }, { href: '/bugs', label: 'Bugs' }]}
        right={
          <>
            {isAdmin ? <ShowHiddenToggleButton showHidden={showHidden} searchParams={searchParams} /> : null}
            <NewPostModalButton label="Report Bug" title="Report a Bug" disabled={!canCreate} variant="wide">
              <GenericPostForm
                action="/api/posts"
                type="bugs"
                titleLabel="Title (optional)"
                titlePlaceholder="Short summary"
                bodyLabel="Details"
                bodyPlaceholder="What happened? What did you expect? Steps to reproduce? Screenshots/links?"
                buttonLabel="Post bug report"
                showImage={true}
                requireImage={false}
                titleRequired={false}
                bodyRequired={true}
              />
            </NewPostModalButton>
          </>
        }
      />
      <BugsClient posts={posts} notice={notice} />
    </>
  );
}
