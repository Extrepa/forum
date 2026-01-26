import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { formatDateTime } from '../../../lib/dates';
import Username from '../../../components/Username';
import { getUsernameColorIndex } from '../../../lib/usernameColor';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ClaimUsernameForm from '../../../components/ClaimUsernameForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    redirect('/');
  }
  const db = await getDb();
  
  // Decode username from URL
  const username = decodeURIComponent(params.username);
  
  // Get user by username
  const profileUser = await db
    .prepare('SELECT id, username, created_at, profile_bio, profile_links FROM users WHERE username_norm = ?')
    .bind(username.toLowerCase())
    .first();

  if (!profileUser) {
    return (
      <div className="stack">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/profile', label: 'Profile' }]} />
        <section className="card">
          <h2 className="section-title">User not found</h2>
          <p className="muted">This user doesn't exist in the goo.</p>
        </section>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  // If viewing own profile, redirect to account page
  if (isOwnProfile) {
    redirect('/account?tab=profile');
  }

  // Get stats for this user
  let stats = null;
  try {
    const threadCount = await db
      .prepare('SELECT COUNT(*) as count FROM forum_threads WHERE author_user_id = ?')
      .bind(profileUser.id)
      .first();
    
    const replyCount = await db
      .prepare('SELECT COUNT(*) as count FROM forum_replies WHERE author_user_id = ? AND is_deleted = 0')
      .bind(profileUser.id)
      .first();

    const recentThreads = await db
      .prepare(
        `SELECT id, title, created_at FROM forum_threads 
         WHERE author_user_id = ? 
         ORDER BY created_at DESC LIMIT 5`
      )
      .bind(profileUser.id)
      .all();

    const recentReplies = await db
      .prepare(
        `SELECT forum_replies.id, forum_replies.created_at, forum_threads.id as thread_id, forum_threads.title as thread_title
         FROM forum_replies
         JOIN forum_threads ON forum_threads.id = forum_replies.thread_id
         WHERE forum_replies.author_user_id = ? AND forum_replies.is_deleted = 0
         ORDER BY forum_replies.created_at DESC LIMIT 5`
      )
      .bind(profileUser.id)
      .all();

    stats = {
      threadCount: threadCount?.count || 0,
      replyCount: replyCount?.count || 0,
      recentThreads: recentThreads?.results || [],
      recentReplies: recentReplies?.results || [],
    };
  } catch (e) {
    stats = {
      threadCount: 0,
      replyCount: 0,
      recentThreads: [],
      recentReplies: [],
    };
  }

  // Parse profile links if they exist
  let profileLinks = [];
  if (profileUser.profile_links) {
    try {
      const parsed = JSON.parse(profileUser.profile_links);
      if (Array.isArray(parsed)) {
        profileLinks = parsed;
      } else {
        profileLinks = [];
      }
    } catch (e) {
      // If not JSON, try comma-separated
      profileLinks = profileUser.profile_links.split(',').map(link => link.trim()).filter(Boolean);
    }
  }

  const platformIcons = {
    github: '💻',
    youtube: '▶️',
    soundcloud: '🎵',
  };

  return (
    <div className="stack">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: `/profile/${encodeURIComponent(profileUser.username)}`, label: profileUser.username }]} />
      <section className="card">
        <h2 className="section-title">Profile</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <strong>Username:</strong> <Username name={profileUser.username} colorIndex={getUsernameColorIndex(profileUser.username)} />
          </div>
          <div>
            <strong>Joined:</strong> <span suppressHydrationWarning>{formatDateTime(profileUser.created_at)}</span>
          </div>
          {profileUser.profile_bio && (
            <div style={{ marginTop: '8px' }}>
              <strong>Bio:</strong>
              <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{profileUser.profile_bio}</p>
            </div>
          )}
          {profileLinks.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong>Social Links:</strong>
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {profileLinks.map((link, idx) => {
                  const linkObj = typeof link === 'object' ? link : { url: link, platform: null };
                  const icon = linkObj.platform ? (platformIcons[linkObj.platform] || '🔗') : '🔗';
                  return (
                    <a
                      key={idx}
                      href={linkObj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(52, 225, 255, 0.3)',
                        background: 'rgba(52, 225, 255, 0.05)',
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(52, 225, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(52, 225, 255, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(52, 225, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(52, 225, 255, 0.3)';
                      }}
                    >
                      <span>{icon}</span>
                      <span>{linkObj.platform ? linkObj.platform.charAt(0).toUpperCase() + linkObj.platform.slice(1) : 'Link'}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
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
                    <span suppressHydrationWarning>{formatDateTime(thread.created_at)}</span>
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
                    <span suppressHydrationWarning>{formatDateTime(reply.created_at)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
