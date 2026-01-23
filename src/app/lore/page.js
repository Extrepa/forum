import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { renderMarkdown } from '../../lib/markdown';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import GenericPostForm from '../../components/GenericPostForm';
import LoreClient from './LoreClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LorePage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const canCreate = !!user && !!user.password_hash;

  const db = await getDb();
  let results = [];
  let dbUnavailable = false;
  try {
    const out = await db
      .prepare(
        `SELECT posts.id, posts.title, posts.body, posts.image_key, posts.is_private, posts.created_at,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
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
      <PageTopRow
        items={[{ href: '/', label: 'Home' }, { href: '/lore', label: 'Lore' }]}
        right={
          <NewPostModalButton label="New Lore" title="New Lore Post" disabled={!canCreate} variant="wide">
            <GenericPostForm
              action="/api/posts"
              type="lore"
              titleLabel="Title (optional)"
              titlePlaceholder="Optional title"
              bodyLabel="Lore"
              bodyPlaceholder="Write the lore..."
              buttonLabel="Post"
              showImage={false}
              titleRequired={false}
              bodyRequired={true}
              showPrivateToggle={true}
              defaultPrivate={false}
            />
          </NewPostModalButton>
        }
      />
      <LoreClient posts={posts} notice={notice} />
    </>
  );
}

