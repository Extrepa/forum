import ClaimUsernameForm from '../../components/ClaimUsernameForm';
import Breadcrumbs from '../../components/Breadcrumbs';
import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { formatDateTime } from '../../lib/dates';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import AccountTabsClient from './AccountTabsClient';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }) {
  const user = await getSessionUser();
  const db = await getDb();

  let stats = null;
  if (user) {
    try {
      // Get post and reply counts
      const threadCount = await db
        .prepare('SELECT COUNT(*) as count FROM forum_threads WHERE author_user_id = ?')
        .bind(user.id)
        .first();
      
      const replyCount = await db
        .prepare('SELECT COUNT(*) as count FROM forum_replies WHERE author_user_id = ? AND is_deleted = 0')
        .bind(user.id)
        .first();

      // Get recent activity (last 5 threads and replies)
      const recentThreads = await db
        .prepare(
          `SELECT id, title, created_at FROM forum_threads 
           WHERE author_user_id = ? 
           ORDER BY created_at DESC LIMIT 5`
        )
        .bind(user.id)
        .all();

      const recentReplies = await db
        .prepare(
          `SELECT forum_replies.id, forum_replies.created_at, forum_threads.id as thread_id, forum_threads.title as thread_title
           FROM forum_replies
           JOIN forum_threads ON forum_threads.id = forum_replies.thread_id
           WHERE forum_replies.author_user_id = ? AND forum_replies.is_deleted = 0
           ORDER BY forum_replies.created_at DESC LIMIT 5`
        )
        .bind(user.id)
        .all();

      // Get user info
      const userInfo = await db
        .prepare('SELECT created_at FROM users WHERE id = ?')
        .bind(user.id)
        .first();

      stats = {
        threadCount: threadCount?.count || 0,
        replyCount: replyCount?.count || 0,
        joinDate: userInfo?.created_at || user.created_at,
        recentThreads: recentThreads?.results || [],
        recentReplies: recentReplies?.results || [],
      };
    } catch (e) {
      // Fallback if queries fail
      stats = {
        threadCount: 0,
        replyCount: 0,
        joinDate: user.created_at,
        recentThreads: [],
        recentReplies: [],
      };
    }
  }

  const activeTab = searchParams?.tab || 'account';

  return (
    <div className="stack">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/account', label: 'Account' }]} />
      <AccountTabsClient 
        activeTab={activeTab}
        user={user}
        stats={stats}
      />
    </div>
  );
}
