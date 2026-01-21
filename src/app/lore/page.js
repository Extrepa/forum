import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { renderMarkdown } from '../../lib/markdown';
import Breadcrumbs from '../../components/Breadcrumbs';
import LoreClient from './LoreClient';

export const dynamic = 'force-dynamic';

export default async function LorePage({ searchParams }) {
  const user = await getSessionUser();
  const isSignedIn = !!user;

  if (!isSignedIn) {
    return (
      <>
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/lore', label: 'Lore' }]} />
        <section className="card">
          <h2 className="section-title">Lore</h2>
          <p className="muted">Sign in to view Lore.</p>
        </section>
      </>
    );
  }

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
         WHERE posts.type = 'lore'
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
      ? 'Lore is not available yet on this environment. Apply migration 0017_shared_posts.sql.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'missing'
      ? 'Text is required.'
      : error === 'notready'
      ? 'Lore is not enabled yet (database updates still applying).'
      : null;

  return (
    <>
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/lore', label: 'Lore' }]} />
      <LoreClient posts={posts} notice={notice} isSignedIn={isSignedIn} />
    </>
  );
}

