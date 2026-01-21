import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { renderMarkdown } from '../../lib/markdown';
import Breadcrumbs from '../../components/Breadcrumbs';
import NostalgiaClient from './NostalgiaClient';

export const dynamic = 'force-dynamic';

export default async function NostalgiaPage({ searchParams }) {
  const user = await getSessionUser();
  const isSignedIn = !!user;
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
         WHERE posts.type = 'nostalgia'
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
      ? 'Nostalgia is not available yet on this environment. Apply migration 0017_shared_posts.sql.'
      : error === 'claim'
      ? 'Sign in before posting.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'missing'
      ? 'Text is required.'
      : error === 'notready'
      ? 'Nostalgia is not enabled yet (database updates still applying).'
      : null;

  return (
    <>
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/nostalgia', label: 'Nostalgia' }]} />
      <NostalgiaClient posts={posts} notice={notice} isSignedIn={isSignedIn} />
    </>
  );
}

