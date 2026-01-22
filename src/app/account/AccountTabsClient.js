'use client';

import { useRouter } from 'next/navigation';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import ClaimUsernameForm from '../../components/ClaimUsernameForm';

function formatDateTime(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AccountTabsClient({ activeTab, user, stats }) {
  const router = useRouter();

  const handleTabChange = (tab) => {
    router.push(`/account?tab=${tab}`, { scroll: false });
  };

  return (
    <section className="card">
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => handleTabChange('account')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'account' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'account' ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'account' ? '600' : '400'
          }}
        >
          Account
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'profile' ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'profile' ? '600' : '400'
          }}
        >
          Profile
        </button>
      </div>

      {activeTab === 'account' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Account Settings</h2>
            <p className="muted" style={{ margin: 0 }}>Simple settings, quick updates.</p>
          </div>
          <hr style={{ marginTop: '16px', marginBottom: '16px', border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
          <ClaimUsernameForm noCardWrapper={true} />
        </div>
      )}

      {activeTab === 'profile' && user && stats && (
        <div>
          <h2 className="section-title">Profile</h2>
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
        </div>
      )}
    </section>
  );
}
