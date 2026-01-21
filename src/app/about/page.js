import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { renderMarkdown } from '../../lib/markdown';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import GenericPostForm from '../../components/GenericPostForm';
import AboutClient from './AboutClient';

export const dynamic = 'force-dynamic';

export default async function AboutPage({ searchParams }) {
  const user = await getSessionUser();
  const isSignedIn = !!user;
  const canCreate = !!user && !user.must_change_password && !!user.password_hash;
  const db = await getDb();

  let results = [];
  let dbUnavailable = false;
  try {
    const out = await db
      .prepare(
        `SELECT posts.id, posts.title, posts.body, posts.image_key, posts.is_private, posts.created_at,
                users.username AS author_name
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.type = 'about'
           AND (${isSignedIn ? '1=1' : 'posts.is_private = 0'})
         ORDER BY posts.created_at DESC
         LIMIT 20`
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
      ? 'About is not available yet on this environment. Apply migration 0017_shared_posts.sql.'
      : error === 'claim'
      ? 'Sign in before posting.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'missing'
      ? 'Text is required.'
      : error === 'notready'
      ? 'About is not enabled yet (database updates still applying).'
      : null;

  return (
    <>
      <PageTopRow
        items={[{ href: '/', label: 'Home' }, { href: '/about', label: 'About' }]}
        right={
          <NewPostModalButton label="New About" title="New About Post" disabled={!canCreate} variant="wide">
            <GenericPostForm
              action="/api/posts"
              type="about"
              titleLabel="Title (optional)"
              titlePlaceholder="Optional title"
              bodyLabel="Body"
              bodyPlaceholder="Describe the site, add links, upload an image if you want..."
              buttonLabel="Post"
              showImage={true}
              requireImage={false}
              titleRequired={false}
              bodyRequired={true}
            />
          </NewPostModalButton>
        }
      />
      <AboutClient posts={posts} notice={notice} />
    </>
  );
}

