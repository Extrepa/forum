import Image from 'next/image';
import Link from 'next/link';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { formatDateTime, formatDate } from '../../../lib/dates';
import Username from '../../../components/Username';
import { getUsernameColorIndex } from '../../../lib/usernameColor';
import { isProfileFlagEnabled } from '../../../lib/featureFlags';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ProfileAvatarHero from '../../../components/ProfileAvatarHero';
import ProfileTabsClient from '../../../components/ProfileTabsClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }) {
  const currentUser = await getSessionUser();
  const db = await getDb();
  const resolved = await params;
  const rawUsername = resolved?.username;

  if (!rawUsername) {
    return (
      <div className="stack">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/profile', label: 'Profile' }]} />
        <section className="card">
          <h2 className="section-title">User not found</h2>
          <p className="muted">No username in the URL.</p>
        </section>
      </div>
    );
  }

  // Decode username from URL
  const username = decodeURIComponent(rawUsername);

  // Get user by username
  let profileUser = null;
  try {
    profileUser = await db
      .prepare(
        `SELECT id, username, role, created_at, profile_bio, profile_links, preferred_username_color_index, profile_views, avatar_key, time_spent_minutes, avatar_edit_minutes,
          profile_mood_text, profile_mood_emoji, profile_mood_updated_at,
          profile_song_url, profile_song_provider, profile_song_autoplay_enabled,
          profile_headline, default_profile_tab
          FROM users WHERE username_norm = ?`
      )
      .bind(username.toLowerCase())
      .first();
  } catch (e) {
    try {
      profileUser = await db
        .prepare(
          'SELECT id, username, role, created_at, profile_bio, profile_links, preferred_username_color_index, profile_views, avatar_key, default_profile_tab FROM users WHERE username_norm = ?'
        )
        .bind(username.toLowerCase())
        .first();
    } catch (_) {
      profileUser = await db
        .prepare(
          'SELECT id, username, role, created_at, profile_bio, profile_links, preferred_username_color_index, profile_views, avatar_key FROM users WHERE username_norm = ?'
        )
        .bind(username.toLowerCase())
        .first();
      if (profileUser) profileUser.default_profile_tab = null;
    }
  }

  if (!profileUser) {
    return (
      <div className="stack">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/profile', label: 'Profile' }]} />
        <section className="card">
          <h2 className="section-title">User not found</h2>
          <p className="muted">This user doesn&apos;t exist in the goo.</p>
        </section>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  const colorIndex = getUsernameColorIndex(profileUser.username, { preferredColorIndex: profileUser.preferred_username_color_index });
  const USERNAME_COLORS = [
    '#34E1FF', // 0: Cyan
    '#FF34F5', // 1: Pink
    '#FFFF00', // 2: Yellow
    '#00FF41', // 3: Green
    '#FF6B00', // 4: Orange
    '#B026FF', // 5: Purple
    '#00D9FF', // 6: Blue
    '#CCFF00', // 7: Lime
  ];
  const userColor = USERNAME_COLORS[colorIndex] || USERNAME_COLORS[0];
  const role = profileUser.role || 'user';
  const roleLabel = role === 'admin' ? 'Drip Warden' : role === 'mod' ? 'Drip Guardian' : 'Drip';
  const roleColor = role === 'admin'
    ? 'var(--role-admin)'
    : role === 'mod'
      ? 'var(--role-mod)'
      : 'var(--role-user)';

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

    let postsCount = 0;
    let postCommentsCount = 0;
    try {
      const postsRows = await db
        .prepare('SELECT COUNT(*) as count FROM posts WHERE author_user_id = ? AND type IN (\'art\',\'bugs\',\'rant\',\'nostalgia\',\'lore\',\'memories\') AND (is_deleted = 0 OR is_deleted IS NULL)')
        .bind(profileUser.id)
        .first();
      const postCommentsRows = await db
        .prepare('SELECT COUNT(*) as count FROM post_comments WHERE author_user_id = ? AND is_deleted = 0')
        .bind(profileUser.id)
        .first();
      postsCount = postsRows?.count || 0;
      postCommentsCount = postCommentsRows?.count || 0;
    } catch (e) {
      // posts / post_comments tables may not exist (migration 0017)
    }

    const threadCount = (forumThreads?.count || 0) + 
                        (devLogs?.count || 0) + 
                        (musicPosts?.count || 0) + 
                        (projects?.count || 0) + 
                        (timelineUpdates?.count || 0) + 
                        (events?.count || 0) + 
                        postsCount;
    
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
                       (eventComments?.count || 0) + 
                       postCommentsCount;

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

    let recentPostsFromShared = { results: [] };
    try {
      recentPostsFromShared = await db
        .prepare(
          `SELECT id, title, created_at, type as post_type FROM posts 
           WHERE author_user_id = ? AND type IN ('art','bugs','rant','nostalgia','lore','memories') AND (is_deleted = 0 OR is_deleted IS NULL)
           ORDER BY created_at DESC LIMIT 10`
        )
        .bind(profileUser.id)
        .all();
    } catch (e) {
      // posts table may not exist
    }

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

    let recentPostComments = { results: [] };
    try {
      recentPostComments = await db
        .prepare(
          `SELECT post_comments.id, post_comments.created_at, posts.id as thread_id, posts.title as thread_title, posts.type as post_type, 'post_comment' as reply_type
           FROM post_comments
           JOIN posts ON posts.id = post_comments.post_id
           WHERE post_comments.author_user_id = ? AND post_comments.is_deleted = 0
           ORDER BY post_comments.created_at DESC LIMIT 10`
        )
        .bind(profileUser.id)
        .all();
    } catch (e) {
      // post_comments table may not exist
    }

    // Merge and sort recent activity
    const allPosts = [
      ...(recentForumThreads?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentDevLogs?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentMusicPosts?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentProjects?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentTimelineUpdates?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentEvents?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentPostsFromShared?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type }))
    ];

    const allReplies = [
      ...(recentForumReplies?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentDevLogComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentMusicComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentProjectReplies?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentTimelineComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentEventComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentPostComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type, post_type: r.post_type }))
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
      timeSpentMinutes: profileUser.time_spent_minutes || 0,
      avatarEditMinutes: profileUser.avatar_edit_minutes || 0,
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
      timeSpentMinutes: profileUser.time_spent_minutes || 0,
      avatarEditMinutes: profileUser.avatar_edit_minutes || 0,
    };
  }

  let guestbookEntries = [];
  try {
    const gb = await db
      .prepare(
        `SELECT g.id, g.owner_user_id, g.author_user_id, g.content, g.created_at, u.username AS author_username
         FROM guestbook_entries g
         JOIN users u ON u.id = g.author_user_id
         WHERE g.owner_user_id = ?
         ORDER BY g.created_at DESC
         LIMIT 200`
      )
      .bind(profileUser.id)
      .all();
    guestbookEntries = (gb.results || []).map((r) => ({
      id: r.id,
      author_username: r.author_username,
      content: r.content,
      created_at: r.created_at,
    }));
  } catch (_) {
    guestbookEntries = [];
  }

  let galleryEntries = [];
  try {
    const gal = await db
      .prepare(
        `SELECT id, image_key, caption, is_cover, created_at
         FROM user_gallery_images
         WHERE user_id = ?
         ORDER BY is_cover DESC, order_index ASC, created_at DESC
         LIMIT 100`
      )
      .bind(profileUser.id)
      .all();
    galleryEntries = (gal.results || []).map((r) => ({
      id: r.id,
      image_key: r.image_key,
      caption: r.caption || '',
      is_cover: Boolean(r.is_cover),
      created_at: r.created_at,
    }));
  } catch (_) {
    galleryEntries = [];
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

  // Section label for post/reply types (for Recent Activity)
  const getSectionLabel = (postType, replyType) => {
    const t = postType || replyType || '';
    const map = {
      forum_thread: 'General',
      forum_reply: 'General',
      dev_log: 'Development',
      dev_log_comment: 'Development',
      music_post: 'Music',
      music_comment: 'Music',
      project: 'Projects',
      project_reply: 'Projects',
      timeline_update: 'Announcements',
      timeline_comment: 'Announcements',
      event: 'Events',
      event_comment: 'Events',
      art: 'Art',
      bugs: 'Bugs',
      rant: 'Rant',
      nostalgia: 'Nostalgia',
      lore: 'Lore',
      memories: 'Memories',
      post_comment: 'Posts',
    };
    if (t === 'post_comment' && postType) {
      return map[postType] || 'Posts';
    }
    return map[t] || 'Forum';
  };

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

  const moodText = profileUser?.profile_mood_text?.trim() || '';
  const moodEmoji = profileUser?.profile_mood_emoji?.trim() || '';
  const profileHeadline = profileUser?.profile_headline?.trim() || '';
  const songUrl = profileUser?.profile_song_url?.trim() || '';
  const songProvider = profileUser?.profile_song_provider?.trim() || '';
  const songAutoplayEnabled = Boolean(profileUser?.profile_song_autoplay_enabled);

  const songProviderLabel = songProvider
    ? songProvider.charAt(0).toUpperCase() + songProvider.slice(1)
    : 'Song';

  const activityItems = (stats.recentActivity || []).map((item) => {
    let href = '#';
    if (item.type === 'thread') {
      const postType = item.postType || item.post_type;
      if (postType === 'forum_thread') href = `/lobby/${item.id}`;
      else if (postType === 'dev_log') href = `/devlog/${item.id}`;
      else if (postType === 'music_post') href = `/music/${item.id}`;
      else if (postType === 'project') href = `/projects/${item.id}`;
      else if (postType === 'timeline_update') href = `/announcements/${item.id}`;
      else if (postType === 'event') href = `/events/${item.id}`;
      else if (['art', 'bugs', 'rant', 'nostalgia', 'lore', 'memories'].includes(postType)) href = `/${postType}/${item.id}`;
    } else {
      const replyType = item.replyType || item.reply_type;
      const threadId = item.thread_id;
      if (replyType === 'forum_reply') href = `/lobby/${threadId}`;
      else if (replyType === 'dev_log_comment') href = `/devlog/${threadId}`;
      else if (replyType === 'music_comment') href = `/music/${threadId}`;
      else if (replyType === 'project_reply') href = `/projects/${threadId}`;
      else if (replyType === 'timeline_comment') href = `/announcements/${threadId}`;
      else if (replyType === 'event_comment') href = `/events/${threadId}`;
      else if (replyType === 'post_comment' && (item.post_type || item.postType)) href = `/${item.post_type || item.postType}/${threadId}`;
    }
    const postType = item.postType || item.post_type;
    const replyType = item.replyType || item.reply_type;
    const section = getSectionLabel(postType, replyType);
    const title = item.type === 'thread' ? item.title : item.thread_title;
    const timeStr = formatDateTime(item.created_at);
    return {
      key: `${item.type}-${item.id}`,
      type: item.type,
      href,
      section,
      title,
      timeStr,
    };
  });

  const latelyLinks = profileLinks
    .map((link) => {
      const linkObj = typeof link === 'object' ? link : { url: link, platform: null };
      if (!linkObj.url) return null;
      const platformLabel = linkObj.platform ? linkObj.platform.toUpperCase() : 'LINK';
      const username = linkObj.platform ? extractUsername(linkObj.platform, linkObj.url) : null;
      return {
        url: linkObj.url,
        label: username ? `${platformLabel}: ${username}` : linkObj.url,
        category: linkObj.platform ? `${platformLabel} LINK` : 'LINK',
        platform: linkObj.platform || null,
      };
    })
    .filter(Boolean);


  const statsForTabs = {
    threadCount: stats.threadCount,
    replyCount: stats.replyCount,
    joinDateShort: formatDate(profileUser.created_at),
    joinDateLong: formatDateTime(profileUser.created_at),
    profileViews: stats.profileViews || 0,
    timeSpentMinutes: stats.timeSpentMinutes || 0,
    avatarEditMinutes: stats.avatarEditMinutes || 0,
  };

  return (
    <div className="stack">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: `/profile/${encodeURIComponent(profileUser.username)}`, label: profileUser.username }]} />
      <section className="card profile-card" style={{ paddingTop: '16px', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
        {/* Single card: header (avatar, username, role, mood/song) + optional headline/socials */}
        <div className="profile-card-header">
          <div className="profile-card-header-avatar">
            <ProfileAvatarHero
              avatarKey={profileUser.avatar_key}
              userColor={userColor}
            />
          </div>
          <div className="profile-card-header-meta">
            <Username
              name={profileUser.username}
              colorIndex={colorIndex}
              href={null}
              style={{
                fontSize: 'clamp(24px, 5vw, 32px)',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                textShadow: `0 0 20px ${userColor}44`,
              }}
            />
            <div style={{ color: roleColor, textShadow: '0 0 10px currentColor', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
              {roleLabel}
            </div>
            {/* Mood or song (compact); gated by feature flags */}
            <div className="profile-card-mood-song">
              {isProfileFlagEnabled('profile_mood') && moodText ? (
                <div className="profile-mood-chip">
                  {moodEmoji && <span>{moodEmoji}</span>}
                  <span>{moodText}</span>
                </div>
              ) : null}
              {isProfileFlagEnabled('profile_music') && songUrl ? (
                <div className="profile-song-compact">
                  <span className="profile-song-provider">{songProviderLabel}</span>
                  <a href={songUrl} target="_blank" rel="noopener noreferrer" className="profile-song-link">
                    {songUrl}
                  </a>
                </div>
              ) : null}
              {(!isProfileFlagEnabled('profile_mood') || !moodText) && (!isProfileFlagEnabled('profile_music') || !songUrl) && (
                <div className="muted" style={{ fontSize: '13px' }}>No mood or song set yet.</div>
              )}
            </div>
            {profileHeadline ? (
              <div className="profile-headline" style={{ marginTop: '8px', fontSize: '14px' }}>{profileHeadline}</div>
            ) : null}
            {(() => {
              const validLinks = profileLinks.filter(l => {
                const o = typeof l === 'object' ? l : { url: l, platform: null };
                return o.platform && o.url;
              });
              const cardLinks = validLinks.filter(l => l.featured).slice(0, 5);
              if (cardLinks.length === 0) return null;
              return (
                <div className="profile-socials-inline" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  {cardLinks.map((link, idx) => {
                    const linkObj = typeof link === 'object' ? link : { url: link, platform: null };
                    const un = extractUsername(linkObj.platform, linkObj.url);
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
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: isSoundCloud ? '1px solid rgba(255, 107, 0, 0.3)' : '1px solid rgba(52, 225, 255, 0.3)',
                          background: isSoundCloud ? 'rgba(255, 107, 0, 0.05)' : 'rgba(52, 225, 255, 0.05)',
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          fontSize: '12px',
                        }}
                      >
                        {getPlatformIcon(linkObj.platform)}
                        {un && <span style={{ color: 'var(--ink)' }}>{un}</span>}
                      </a>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          {isOwnProfile && (
            <div className="profile-card-header-actions">
              <Link
                href="/account?tab=profile"
                className="profile-edit-profile-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: '1px solid rgba(52, 225, 255, 0.4)',
                  background: 'rgba(52, 225, 255, 0.1)',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                }}
              >
                Edit profile
              </Link>
            </div>
          )}
        </div>

        {profileUser.profile_bio ? (
          <div className="profile-card-bio" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <strong>Bio:</strong>
            <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{profileUser.profile_bio}</p>
          </div>
        ) : null}

        <ProfileTabsClient
          activityItems={activityItems}
          hasActivity={activityItems.length > 0}
          latelyLinks={latelyLinks}
          galleryCount={galleryEntries.length}
          notesCount={guestbookEntries.length}
          filesEnabled={false}
          stats={statsForTabs}
          initialTab={profileUser.default_profile_tab === 'none' || !profileUser.default_profile_tab ? null : profileUser.default_profile_tab || 'stats'}
          guestbookEntries={guestbookEntries}
          profileUsername={profileUser.username}
          canLeaveMessage={!isOwnProfile && !!currentUser}
          galleryEntries={galleryEntries}
        />
      </section>
    </div>
  );
}
