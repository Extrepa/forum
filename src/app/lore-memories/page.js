import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { renderMarkdown } from '../../lib/markdown';
import { isAdminUser } from '../../lib/admin';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import ShowHiddenToggleButton from '../../components/ShowHiddenToggleButton';
import GenericPostForm from '../../components/GenericPostForm';
import LoreMemoriesClient from './LoreMemoriesClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LoreMemoriesPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const isAdmin = isAdminUser(user);
  const showHidden = isAdmin && searchParams?.showHidden === '1';
  const canCreate = !!user && !!user.password_hash;

  const db = await getDb();
  let results = [];
  let dbUnavailable = false;
  const hiddenFilter = showHidden ? '' : 'AND (posts.is_hidden = 0 OR posts.is_hidden IS NULL)';
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
         WHERE posts.type IN ('lore', 'memories')
           ${hiddenFilter}
           AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL)
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
      ? 'Lore & Memories is not available yet on this environment. Apply migration 0017_shared_posts.sql.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'missing'
      ? 'Text is required.'
      : error === 'notready'
      ? 'Lore & Memories is not enabled yet (database updates still applying).'
      : null;

  return (
    <>
      <PageTopRow
        items={[{ href: '/', label: 'Home' }, { href: '/lore-memories', label: 'Lore & Memories' }]}
        right={
          <>
            {isAdmin ? <ShowHiddenToggleButton showHidden={showHidden} searchParams={searchParams} /> : null}
            <NewPostModalButton label="New Post" title="New Lore or Memory Post" disabled={!canCreate} variant="wide">
              <GenericPostForm
                action="/api/posts"
                allowedTypes={['lore', 'memories']}
                titleLabel="Title (optional)"
                titlePlaceholder="Optional title"
                bodyLabel="Lore or Memory"
                bodyPlaceholder="Write the lore or share the memory..."
                buttonLabel="Post"
                showImage={true}
                requireImage={false}
                titleRequired={false}
                bodyRequired={true}
                showPrivateToggle={false}
              />
            </NewPostModalButton>
          </>
        }
      />
      <LoreMemoriesClient posts={posts} notice={notice} />
    </>
  );
}
