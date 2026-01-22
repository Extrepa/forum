import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { renderMarkdown } from '../../lib/markdown';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import GenericPostForm from '../../components/GenericPostForm';
import RantClient from './RantClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RantPage({ searchParams }) {
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
        `SELECT posts.id, posts.title, posts.body, posts.image_key, posts.is_private, posts.created_at,
                users.username AS author_name
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.type = 'rant'
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
      ? 'Rant is not available yet on this environment. Apply migration 0017_shared_posts.sql.'
      : error === 'claim'
      ? 'Sign in before posting.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'missing'
      ? 'Text is required.'
      : error === 'notready'
      ? 'Rant is not enabled yet (database updates still applying).'
      : null;

  return (
    <>
      <PageTopRow
        items={[{ href: '/', label: 'Home' }, { href: '/rant', label: 'Rant' }]}
        right={
          <NewPostModalButton label="New Rant" title="New Rant" disabled={!canCreate} variant="wide">
            <GenericPostForm
              action="/api/posts"
              type="rant"
              titleLabel="Title (optional)"
              titlePlaceholder="Optional title"
              bodyLabel="Rant"
              bodyPlaceholder="Let it out..."
              buttonLabel="Post rant"
              showImage={false}
              titleRequired={false}
              bodyRequired={true}
            />
          </NewPostModalButton>
        }
      />
      <RantClient posts={posts} notice={notice} />
    </>
  );
}

