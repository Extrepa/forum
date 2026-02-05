import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { isAdminUser } from '../../lib/admin';
import { getRecentAdminActions } from '../../lib/audit';
import AdminConsole from '../../components/AdminConsole';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function safeCount(db, sql, binds = []) {
  try {
    const row = await db.prepare(sql).bind(...binds).first();
    return Number(row?.count || 0);
  } catch (e) {
    return 0;
  }
}

async function gatherStats(db) {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const totalUsers = await safeCount(db, 'SELECT COUNT(*) as count FROM users', []);
  const active24h = await safeCount(db, 'SELECT COUNT(*) as count FROM users WHERE last_seen >= ?', [dayAgo]);
  const active7d = await safeCount(db, 'SELECT COUNT(*) as count FROM users WHERE last_seen >= ?', [weekAgo]);
  const posts24h = await safeCount(db, 'SELECT COUNT(*) as count FROM forum_threads WHERE created_at >= ? AND (is_deleted = 0 OR is_deleted IS NULL)', [dayAgo]);
  const posts7d = await safeCount(db, 'SELECT COUNT(*) as count FROM forum_threads WHERE created_at >= ? AND (is_deleted = 0 OR is_deleted IS NULL)', [weekAgo]);
  const comments24h = await safeCount(db, 'SELECT COUNT(*) as count FROM forum_replies WHERE created_at >= ? AND (is_deleted = 0 OR is_deleted IS NULL)', [dayAgo]);
  const comments7d = await safeCount(db, 'SELECT COUNT(*) as count FROM forum_replies WHERE created_at >= ? AND (is_deleted = 0 OR is_deleted IS NULL)', [weekAgo]);
  const hiddenPosts = await safeCount(db, 'SELECT COUNT(*) as count FROM forum_threads WHERE is_hidden = 1');
  const lockedPosts = await safeCount(db, 'SELECT COUNT(*) as count FROM forum_threads WHERE is_locked = 1');
  const pinnedPosts = await safeCount(db, 'SELECT COUNT(*) as count FROM forum_threads WHERE is_pinned = 1');
  const flaggedItems = await safeCount(db, "SELECT COUNT(*) as count FROM reports WHERE status = 'open'");

  return {
    totalUsers,
    active24h,
    active7d,
    posts24h,
    posts7d,
    comments24h,
    comments7d,
    hiddenPosts,
    lockedPosts,
    pinnedPosts,
    flaggedItems
  };
}

async function loadRecentThreads(db, limit = 24) {
  try {
    const rows = await db
      .prepare(
        `SELECT forum_threads.id, forum_threads.title, forum_threads.body, forum_threads.created_at,
                forum_threads.is_pinned, forum_threads.is_hidden, forum_threads.is_locked,
                users.username AS author_name
         FROM forum_threads
         JOIN users ON users.id = forum_threads.author_user_id
         WHERE (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
         ORDER BY forum_threads.created_at DESC
         LIMIT ?`
      )
      .bind(limit)
      .all();
    return (rows?.results || []).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      createdAt: row.created_at,
      isPinned: Boolean(row.is_pinned),
      isHidden: Boolean(row.is_hidden),
      isLocked: Boolean(row.is_locked),
      authorName: row.author_name,
      type: 'forum_thread'
    }));
  } catch (e) {
    return [];
  }
}

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    redirect('/');
  }

  const db = await getDb();
  const [stats, posts, actions] = await Promise.all([
    gatherStats(db),
    loadRecentThreads(db),
    getRecentAdminActions(db, 8)
  ]);

  return (
    <div className="admin-page stack">
      <AdminConsole stats={stats} posts={posts} actions={actions} user={user} />
    </div>
  );
}
