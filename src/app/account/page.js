import ClaimUsernameForm from '../../components/ClaimUsernameForm';
import Breadcrumbs from '../../components/Breadcrumbs';
import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { formatDateTime } from '../../lib/dates';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
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

  return (
    <div className="stack">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/account', label: 'Account' }]} />
      <section className="card">
        <h2 className="section-title">Account</h2>
        <p className="muted">Simple settings, quick updates.</p>
      </section>

      {user && stats && (
        <section className="card">
          <h3 className="section-title">Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <strong>Username:</strong> <Username name={user.username} colorIndex={getUsernameColorIndex(user.username)} />
            </div>
            <div>
              <strong>Joined:</strong> {formatDateTime(stats.joinDate)}
            </div>
            <div>
              <strong>Posts:</strong> {stats.threadCount} {stats.threadCount === 1 ? 'thread' : 'threads'}
            </div>
            <div>
              <strong>Replies:</strong> {stats.replyCount} {stats.replyCount === 1 ? 'reply' : 'replies'}
            </div>
            <div>
              <strong>Total activity:</strong> {stats.threadCount + stats.replyCount} {stats.threadCount + stats.replyCount === 1 ? 'post' : 'posts'}
            </div>
          </div>

          {(stats.recentThreads.length > 0 || stats.recentReplies.length > 0) && (
            <div style={{ marginTop: '24px' }}>
              <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>Recent Activity</h4>
              <div className="list">
                {stats.recentThreads.map(thread => (
                  <a
                    key={thread.id}
                    href={`/lobby/${thread.id}`}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                  >
                    <div style={{ marginBottom: '4px' }}>
                      <strong>{thread.title}</strong>
                    </div>
                    <div className="list-meta" style={{ fontSize: '12px' }}>
                      {formatDateTime(thread.created_at)}
                    </div>
                  </a>
                ))}
                {stats.recentReplies.map(reply => (
                  <a
                    key={reply.id}
                    href={`/lobby/${reply.thread_id}`}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                  >
                    <div style={{ marginBottom: '4px' }}>
                      Replied to <strong>{reply.thread_title}</strong>
                    </div>
                    <div className="list-meta" style={{ fontSize: '12px' }}>
                      {formatDateTime(reply.created_at)}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <ClaimUsernameForm />
    </div>
  );
}

