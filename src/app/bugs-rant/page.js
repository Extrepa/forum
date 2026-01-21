import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { renderMarkdown } from '../../lib/markdown';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import GenericPostForm from '../../components/GenericPostForm';
import BugsRantClient from './BugsRantClient';

export const dynamic = 'force-dynamic';

export default async function BugsRantPage({ searchParams }) {
  const user = await getSessionUser();
  const isSignedIn = !!user;
  const canCreate = !!user && !user.must_change_password && !!user.password_hash;
  const db = await getDb();

  let results = [];
  let dbUnavailable = false;
  try {
    const out = await db
      .prepare(
        `SELECT posts.id, posts.type, posts.title, posts.body, posts.image_key, posts.is_private, posts.created_at,
                users.username AS author_name
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.type IN ('bugs', 'rant')
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
              type="bugs"
              titleLabel="Title (optional)"
              titlePlaceholder="Short summary"
              bodyLabel="Details"
              bodyPlaceholder="What happened? What did you expect? Steps to reproduce? Screenshots/links?"
              buttonLabel="Post"
              showImage={true}
              requireImage={false}
              titleRequired={false}
              bodyRequired={true}
            />
          </NewPostModalButton>
        }
      />
      <BugsRantClient posts={posts} notice={notice} />
    </>
  );
}
