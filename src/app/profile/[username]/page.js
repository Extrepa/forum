import Image from 'next/image';
import Link from 'next/link';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { getStatsForUser } from '../../../lib/stats';
import { formatDateTime, formatDate } from '../../../lib/dates';
import ProfileMoodSongBlock from '../../../components/ProfileMoodSongBlock';
import Username from '../../../components/Username';
import { getUsernameColorIndex } from '../../../lib/usernameColor';
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

  // Base user row (no profile-extras columns) so page never fails if migration 0054 not applied
  let profileUser = null;
  try {
    profileUser = await db
      .prepare(
        'SELECT id, username, role, created_at, profile_bio, profile_links, preferred_username_color_index, profile_views, avatar_key, time_spent_minutes, avatar_edit_minutes FROM users WHERE username_norm = ?'
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
  }
  // Profile extras (mood, song, headline, default tab) – separate query for migration 0054 columns
  if (profileUser) {
    try {
      const extras = await db
        .prepare(
          `SELECT profile_mood_text, profile_mood_emoji, profile_mood_updated_at,
           profile_song_url, profile_song_provider, profile_song_autoplay_enabled,
           profile_headline, default_profile_tab FROM users WHERE id = ?`
        )
        .bind(profileUser.id)
        .first();
      if (extras) profileUser = { ...profileUser, ...extras };
    } catch (_) {
      profileUser.default_profile_tab = profileUser.default_profile_tab ?? null;
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

  // Increment profile views only when viewed by someone else (so own profile and account stats match)
  if (!isOwnProfile) {
    try {
      await db
        .prepare('UPDATE users SET profile_views = COALESCE(profile_views, 0) + 1 WHERE id = ?')
        .bind(profileUser.id)
        .run();
    } catch (e) {
      console.error('Failed to increment profile views:', e);
    }
  }

  const profileViewsDisplay = !isOwnProfile
    ? (Number(profileUser.profile_views) || 0) + 1
    : undefined;
  const stats = await getStatsForUser(db, profileUser.id, profileViewsDisplay !== undefined ? { profileViewsDisplay } : {});
  if (stats.joinDate == null) stats.joinDate = profileUser.created_at;
  const coverMode = stats?.profileCoverMode || 'cover';

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
         LIMIT 10`
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
  const coverEntry = galleryEntries.find((entry) => entry.is_cover);

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
    threadCount: Number(stats.threadCount) || 0,
    replyCount: Number(stats.replyCount) || 0,
    joinDateShort: formatDate(profileUser.created_at),
    joinDateLong: formatDateTime(profileUser.created_at),
    profileViews: Number(stats.profileViews) || 0,
    timeSpentMinutes: Number(stats.timeSpentMinutes) || 0,
    avatarEditMinutes: Number(stats.avatarEditMinutes) || 0,
  };

  return (
    <div className="stack">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minWidth: 0 }}>
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: `/profile/${encodeURIComponent(profileUser.username)}`, label: profileUser.username }]} />
        {isOwnProfile && (
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
              flexShrink: 0,
            }}
          >
            Edit profile
          </Link>
        )}
      </div>
      <section className="card profile-card neon-outline-card" style={{ paddingTop: '16px', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
        {/* Single card: header (avatar, username, role, mood/song) + optional headline/socials */}
        <div
          className={`profile-card-header${coverEntry ? ' profile-card-header--with-cover' : ''}`}
          data-profile-mood-song-right-column-parent
          data-cover-mode={coverEntry ? coverMode : undefined}
          style={coverEntry ? { '--profile-cover-image': `url(/api/media/${coverEntry.image_key})` } : undefined}
        >
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
            <div className="profile-role-label" style={{ color: roleColor, textShadow: '0 0 10px currentColor', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
              {roleLabel}
            </div>
            {/* Mood/song/player; client fetches profile-extras when server data empty and own profile */}
            <ProfileMoodSongBlock
              initialMoodText={moodText}
              initialMoodEmoji={moodEmoji}
              initialSongUrl={songUrl}
              initialSongProvider={songProvider}
              initialSongAutoplayEnabled={songAutoplayEnabled}
              initialHeadline={profileHeadline}
              isOwnProfile={isOwnProfile}
              songProviderLabel={songProviderLabel}
            />
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
          <div className="profile-mood-song-right-column-slot" data-profile-mood-song-right-column-slot />
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
