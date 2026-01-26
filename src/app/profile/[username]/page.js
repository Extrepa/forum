import { redirect } from 'next/navigation';
import Image from 'next/image';
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
    .prepare('SELECT id, username, created_at, profile_bio, profile_links, preferred_username_color_index FROM users WHERE username_norm = ?')
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

  // Extract username from platform URLs
  const extractUsername = (platform, url) => {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname;
      
      if (platform === 'soundcloud') {
        // SoundCloud: https://soundcloud.com/username
        const match = pathname.match(/^\/([^\/]+)/);
        return match ? match[1] : null;
      } else if (platform === 'github') {
        // GitHub: https://github.com/username
        const match = pathname.match(/^\/([^\/]+)/);
        return match ? match[1] : null;
      } else if (platform === 'youtube') {
        // YouTube: https://youtube.com/@username or /c/channelname or /user/username
        if (pathname.startsWith('/@')) {
          return pathname.slice(2);
        } else if (pathname.startsWith('/c/')) {
          return pathname.slice(3);
        } else if (pathname.startsWith('/user/')) {
          return pathname.slice(6);
        } else if (pathname.startsWith('/channel/')) {
          return pathname.slice(9);
        }
        return null;
      } else if (platform === 'discord') {
        // Discord: https://discord.com/users/userid or https://discord.gg/invitecode
        if (pathname.startsWith('/users/')) {
          return pathname.slice(7);
        } else if (pathname.startsWith('/gg/')) {
          return pathname.slice(4);
        }
        return null;
      } else if (platform === 'chatgpt') {
        // ChatGPT: https://chat.openai.com/g/g-xxx or https://chatgpt.com/share/xxx
        if (pathname.startsWith('/g/g-')) {
          return pathname.slice(5);
        } else if (pathname.startsWith('/share/')) {
          return pathname.slice(7);
        }
        return null;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Get platform icon component
  const getPlatformIcon = (platform) => {
    const iconMap = {
      github: '/icons/social/github.png',
      youtube: '/icons/social/youtube.png',
      soundcloud: '/icons/social/soundcloud.png',
      discord: '/icons/social/discord.png',
      chatgpt: '/icons/social/chatgpt.png',
    };
    
    const iconPath = iconMap[platform];
    if (!iconPath) return '🔗';
    
    return (
      <Image
        src={iconPath}
        alt={platform}
        width={16}
        height={16}
        style={{ display: 'block', flexShrink: 0 }}
      />
    );
  };

  const colorOptions = [
    { index: null, name: 'Auto (Default)', color: '#34E1FF' },
    { index: 0, name: 'Cyan', color: '#34E1FF' },
    { index: 1, name: 'Pink', color: '#FF34F5' },
    { index: 2, name: 'Yellow', color: '#FFFF00' },
    { index: 3, name: 'Green', color: '#00FF41' },
    { index: 4, name: 'Orange', color: '#FF6B00' },
    { index: 5, name: 'Purple', color: '#B026FF' },
    { index: 6, name: 'Light Blue', color: '#00D9FF' },
    { index: 7, name: 'Lime', color: '#CCFF00' },
  ];

  const selectedColorIndex = profileUser.preferred_username_color_index ?? null;
  const selectedColor = colorOptions.find(opt => opt.index === selectedColorIndex) || colorOptions[0];

  return (
    <div className="stack">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: `/profile/${encodeURIComponent(profileUser.username)}`, label: profileUser.username }]} />
      <section className="card">
        <h2 className="section-title">Profile</h2>
        
        {/* Two Column Layout */}
        <div className="account-columns" style={{ marginBottom: '24px' }}>
          {/* Left Column: Stats */}
          <div className="account-col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong>Joined:</strong> {formatDateTime(profileUser.created_at)}
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
          </div>

          {/* Right Column: Username, Color, and Social Links */}
          <div className="account-col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, maxWidth: '100%' }}>
              {/* Username Row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, maxWidth: '100%' }}>
                <label style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 'bold' }}>
                  Username:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
                  <Username
                    name={profileUser.username}
                    colorIndex={getUsernameColorIndex(profileUser.username, { preferredColorIndex: profileUser.preferred_username_color_index })}
                  />
                </div>
              </div>

              {/* Color Picker Display Row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, maxWidth: '100%', marginTop: '8px' }}>
                <label style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 'bold' }}>
                  Username color:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
                  {colorOptions.map((option) => {
                    const isSelected = selectedColorIndex === option.index;
                    const size = 18;
                    return (
                      <div
                        key={option.index ?? 'auto'}
                        style={{
                          flex: '0 0 auto',
                          width: `${size}px`,
                          height: `${size}px`,
                          minWidth: `${size}px`,
                          maxWidth: `${size}px`,
                          minHeight: `${size}px`,
                          maxHeight: `${size}px`,
                          borderRadius: '50%',
                          border: isSelected ? '2px solid var(--accent)' : '1px solid rgba(52, 225, 255, 0.3)',
                          background: option.index === null
                            ? 'repeating-linear-gradient(45deg, rgba(52, 225, 255, 0.3), rgba(52, 225, 255, 0.3) 4px, transparent 4px, transparent 8px)'
                            : option.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                          boxShadow: isSelected ? '0 0 12px rgba(52, 225, 255, 0.6)' : 'none',
                        }}
                        title={option.name}
                      >
                        {option.index === null && (
                          <span style={{ fontSize: '8px', color: 'var(--ink)', fontWeight: 'bold', lineHeight: 1, display: 'block' }}>A</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Social Links Display */}
              {profileLinks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start', marginTop: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 'bold' }}>
                    Socials:
                  </label>
                  {profileLinks.map((link, idx) => {
                    const linkObj = typeof link === 'object' ? link : { url: link, platform: null };
                    if (!linkObj.platform || !linkObj.url) return null;
                    const username = extractUsername(linkObj.platform, linkObj.url);
                    const isSoundCloud = linkObj.platform === 'soundcloud';
                    return (
                      <a
                        key={idx}
                        href={linkObj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: isSoundCloud
                            ? '1px solid rgba(255, 107, 0, 0.3)'
                            : '1px solid rgba(52, 225, 255, 0.3)',
                          background: isSoundCloud
                            ? 'rgba(255, 107, 0, 0.05)'
                            : 'rgba(52, 225, 255, 0.05)',
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          width: 'fit-content'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {getPlatformIcon(linkObj.platform)}
                        </span>
                        {username && (
                          <span style={{ color: 'var(--ink)', fontSize: '13px', whiteSpace: 'nowrap' }}>{username}</span>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {profileUser.profile_bio && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <strong>Bio:</strong>
            <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{profileUser.profile_bio}</p>
          </div>
        )}

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
