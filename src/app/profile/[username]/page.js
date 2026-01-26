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
    .prepare('SELECT id, username, created_at, profile_bio, profile_links, preferred_username_color_index, profile_views FROM users WHERE username_norm = ?')
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

  // Increment profile views (only when viewed by someone else)
  try {
    await db
      .prepare('UPDATE users SET profile_views = COALESCE(profile_views, 0) + 1 WHERE id = ?')
      .bind(profileUser.id)
      .run();
  } catch (e) {
    // Ignore errors - profile views are not critical
    console.error('Failed to increment profile views:', e);
  }

  // Get stats for this user
  let stats = null;
  try {
    // Count all post types
    const forumThreads = await db
      .prepare('SELECT COUNT(*) as count FROM forum_threads WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)')
      .bind(profileUser.id)
      .first();
    
    const devLogs = await db
      .prepare('SELECT COUNT(*) as count FROM dev_logs WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)')
      .bind(profileUser.id)
      .first();
    
    const musicPosts = await db
      .prepare('SELECT COUNT(*) as count FROM music_posts WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)')
      .bind(profileUser.id)
      .first();
    
    const projects = await db
      .prepare('SELECT COUNT(*) as count FROM projects WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)')
      .bind(profileUser.id)
      .first();
    
    const timelineUpdates = await db
      .prepare('SELECT COUNT(*) as count FROM timeline_updates WHERE author_user_id = ?')
      .bind(profileUser.id)
      .first();
    
    const events = await db
      .prepare('SELECT COUNT(*) as count FROM events WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)')
      .bind(profileUser.id)
      .first();

    const threadCount = (forumThreads?.count || 0) + 
                        (devLogs?.count || 0) + 
                        (musicPosts?.count || 0) + 
                        (projects?.count || 0) + 
                        (timelineUpdates?.count || 0) + 
                        (events?.count || 0);
    
    // Count all reply types
    const forumReplies = await db
      .prepare('SELECT COUNT(*) as count FROM forum_replies WHERE author_user_id = ? AND is_deleted = 0')
      .bind(profileUser.id)
      .first();
    
    const devLogComments = await db
      .prepare('SELECT COUNT(*) as count FROM dev_log_comments WHERE author_user_id = ? AND is_deleted = 0')
      .bind(profileUser.id)
      .first();
    
    const musicComments = await db
      .prepare('SELECT COUNT(*) as count FROM music_comments WHERE author_user_id = ? AND is_deleted = 0')
      .bind(profileUser.id)
      .first();
    
    const projectReplies = await db
      .prepare('SELECT COUNT(*) as count FROM project_replies WHERE author_user_id = ? AND is_deleted = 0')
      .bind(profileUser.id)
      .first();
    
    const timelineComments = await db
      .prepare('SELECT COUNT(*) as count FROM timeline_comments WHERE author_user_id = ? AND is_deleted = 0')
      .bind(profileUser.id)
      .first();
    
    const eventComments = await db
      .prepare('SELECT COUNT(*) as count FROM event_comments WHERE author_user_id = ? AND is_deleted = 0')
      .bind(profileUser.id)
      .first();

    const replyCount = (forumReplies?.count || 0) + 
                       (devLogComments?.count || 0) + 
                       (musicComments?.count || 0) + 
                       (projectReplies?.count || 0) + 
                       (timelineComments?.count || 0) + 
                       (eventComments?.count || 0);

    // Get recent posts from all types
    const recentForumThreads = await db
      .prepare(
        `SELECT id, title, created_at, 'forum_thread' as post_type FROM forum_threads 
         WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
         ORDER BY created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    const recentDevLogs = await db
      .prepare(
        `SELECT id, title, created_at, 'dev_log' as post_type FROM dev_logs 
         WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
         ORDER BY created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    const recentMusicPosts = await db
      .prepare(
        `SELECT id, title, created_at, 'music_post' as post_type FROM music_posts 
         WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
         ORDER BY created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    const recentProjects = await db
      .prepare(
        `SELECT id, title, created_at, 'project' as post_type FROM projects 
         WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
         ORDER BY created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    const recentTimelineUpdates = await db
      .prepare(
        `SELECT id, title, created_at, 'timeline_update' as post_type FROM timeline_updates 
         WHERE author_user_id = ?
         ORDER BY created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    const recentEvents = await db
      .prepare(
        `SELECT id, title, created_at, 'event' as post_type FROM events 
         WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
         ORDER BY created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    // Get recent replies/comments from all types
    const recentForumReplies = await db
      .prepare(
        `SELECT forum_replies.id, forum_replies.created_at, forum_threads.id as thread_id, forum_threads.title as thread_title, 'forum_reply' as reply_type
         FROM forum_replies
         JOIN forum_threads ON forum_threads.id = forum_replies.thread_id
         WHERE forum_replies.author_user_id = ? AND forum_replies.is_deleted = 0
         ORDER BY forum_replies.created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    const recentDevLogComments = await db
      .prepare(
        `SELECT dev_log_comments.id, dev_log_comments.created_at, dev_logs.id as thread_id, dev_logs.title as thread_title, 'dev_log_comment' as reply_type
         FROM dev_log_comments
         JOIN dev_logs ON dev_logs.id = dev_log_comments.log_id
         WHERE dev_log_comments.author_user_id = ? AND dev_log_comments.is_deleted = 0
         ORDER BY dev_log_comments.created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    const recentMusicComments = await db
      .prepare(
        `SELECT music_comments.id, music_comments.created_at, music_posts.id as thread_id, music_posts.title as thread_title, 'music_comment' as reply_type
         FROM music_comments
         JOIN music_posts ON music_posts.id = music_comments.post_id
         WHERE music_comments.author_user_id = ? AND music_comments.is_deleted = 0
         ORDER BY music_comments.created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    const recentProjectReplies = await db
      .prepare(
        `SELECT project_replies.id, project_replies.created_at, projects.id as thread_id, projects.title as thread_title, 'project_reply' as reply_type
         FROM project_replies
         JOIN projects ON projects.id = project_replies.project_id
         WHERE project_replies.author_user_id = ? AND project_replies.is_deleted = 0
         ORDER BY project_replies.created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    const recentTimelineComments = await db
      .prepare(
        `SELECT timeline_comments.id, timeline_comments.created_at, timeline_updates.id as thread_id, timeline_updates.title as thread_title, 'timeline_comment' as reply_type
         FROM timeline_comments
         JOIN timeline_updates ON timeline_updates.id = timeline_comments.update_id
         WHERE timeline_comments.author_user_id = ? AND timeline_comments.is_deleted = 0
         ORDER BY timeline_comments.created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    const recentEventComments = await db
      .prepare(
        `SELECT event_comments.id, event_comments.created_at, events.id as thread_id, events.title as thread_title, 'event_comment' as reply_type
         FROM event_comments
         JOIN events ON events.id = event_comments.event_id
         WHERE event_comments.author_user_id = ? AND event_comments.is_deleted = 0
         ORDER BY event_comments.created_at DESC LIMIT 10`
      )
      .bind(profileUser.id)
      .all();

    // Merge and sort recent activity
    const allPosts = [
      ...(recentForumThreads?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentDevLogs?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentMusicPosts?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentProjects?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentTimelineUpdates?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentEvents?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type }))
    ];

    const allReplies = [
      ...(recentForumReplies?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentDevLogComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentMusicComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentProjectReplies?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentTimelineComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentEventComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type }))
    ];

    const allActivity = [...allPosts, ...allReplies]
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 10);

    stats = {
      threadCount,
      replyCount,
      joinDate: profileUser.created_at,
      recentThreads: allPosts.slice(0, 10),
      recentReplies: allReplies.slice(0, 10),
      recentActivity: allActivity,
      profileViews: profileUser.profile_views || 0,
    };
  } catch (e) {
    stats = {
      threadCount: 0,
      replyCount: 0,
      joinDate: profileUser.created_at,
      recentThreads: [],
      recentReplies: [],
      recentActivity: [],
      profileViews: profileUser.profile_views || 0,
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


  return (
    <div className="stack">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: `/profile/${encodeURIComponent(profileUser.username)}`, label: profileUser.username }]} />
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Profile</h2>
          <h2 className="section-title" style={{ margin: 0 }}>Stats</h2>
        </div>
        
        {/* Two Column Layout */}
        <div className="account-columns" style={{ marginBottom: '24px' }}>
          {/* Left Column: Username, Color, and Social Links */}
          <div className="account-col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Username Row - same line */}
              <div>
                <strong>Username:</strong>{' '}
                <Username
                  name={profileUser.username}
                  colorIndex={getUsernameColorIndex(profileUser.username, { preferredColorIndex: profileUser.preferred_username_color_index })}
                />
              </div>

              {/* Social Links Display */}
              {profileLinks.length > 0 && (
                <div>
                  <strong>Socials:</strong>
                  <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
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
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Stats */}
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
              <div>
                <strong>Profile views:</strong> {stats.profileViews || 0} {stats.profileViews === 1 ? 'view' : 'views'}
              </div>
            </div>
          </div>
        </div>

        {profileUser.profile_bio && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <strong>Bio:</strong>
            <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{profileUser.profile_bio}</p>
          </div>
        )}

        {stats.recentActivity && stats.recentActivity.length > 0 ? (
          <div style={{ marginTop: '24px' }}>
            <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>Recent Activity</h4>
            <div className="list">
              {stats.recentActivity.map((item) => {
                // Determine URL based on post/reply type
                let href = '#';
                if (item.type === 'thread') {
                  const postType = item.postType || item.post_type;
                  if (postType === 'forum_thread') href = `/lobby/${item.id}`;
                  else if (postType === 'dev_log') href = `/devlog/${item.id}`;
                  else if (postType === 'music_post') href = `/music/${item.id}`;
                  else if (postType === 'project') href = `/projects/${item.id}`;
                  else if (postType === 'timeline_update') href = `/announcements/${item.id}`;
                  else if (postType === 'event') href = `/events/${item.id}`;
                } else {
                  const replyType = item.replyType || item.reply_type;
                  const threadId = item.thread_id;
                  if (replyType === 'forum_reply') href = `/lobby/${threadId}`;
                  else if (replyType === 'dev_log_comment') href = `/devlog/${threadId}`;
                  else if (replyType === 'music_comment') href = `/music/${threadId}`;
                  else if (replyType === 'project_reply') href = `/projects/${threadId}`;
                  else if (replyType === 'timeline_comment') href = `/announcements/${threadId}`;
                  else if (replyType === 'event_comment') href = `/events/${threadId}`;
                }
                
                return (
                  <a
                    key={`${item.type}-${item.id}`}
                    href={href}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                  >
                    <div style={{ marginBottom: '4px' }}>
                      {item.type === 'thread' ? (
                        <strong>{item.title}</strong>
                      ) : (
                        <>Replied to <strong>{item.thread_title}</strong></>
                      )}
                    </div>
                    <div className="list-meta" style={{ fontSize: '12px' }}>
                      <span suppressHydrationWarning>{formatDateTime(item.created_at)}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '24px' }}>
            <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>Recent Activity</h4>
            <div className="muted" style={{ padding: '12px' }}>No recent activity yet.</div>
          </div>
        )}
      </section>
    </div>
  );
}
