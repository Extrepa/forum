'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import ClaimUsernameForm from '../../components/ClaimUsernameForm';
import AvatarCustomizer from '../../components/AvatarCustomizer';
import { formatDateTime, formatDate } from '../../lib/dates';
import { getAvatarUrl } from '../../lib/media';
import AvatarImage from '../../components/AvatarImage';
import { getMoodChipStyle, MOOD_OPTIONS } from '../../lib/moodThemes';

function getRarityColor(value) {
  if (value === 0) return 'var(--muted)';
  if (value < 10) return 'var(--accent)';
  if (value < 100) return '#00f5a0';
  if (value < 1000) return '#5b8def';
  return '#b794f6';
}

export default function AccountTabsClient({ activeTab, user, stats: initialStats }) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingSocials, setIsEditingSocials] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [usernameStatus, setUsernameStatus] = useState({ type: 'idle', message: null });
  const [selectedColorIndex, setSelectedColorIndex] = useState(user?.preferred_username_color_index ?? null);
  const [colorStatus, setColorStatus] = useState({ type: 'idle', message: null });
  const [socialLinks, setSocialLinks] = useState(() => {
    const links = initialStats?.profileLinks || [];
    const platforms = ['github', 'youtube', 'soundcloud', 'discord', 'chatgpt'];
    const linkMap = {};
    links.forEach(link => {
      if (typeof link === 'object' && link.platform && link.url) {
        linkMap[link.platform] = { url: link.url, featured: Boolean(link.featured) };
      }
    });
    return platforms.map(platform => ({
      platform,
      url: linkMap[platform]?.url || '',
      featured: linkMap[platform]?.featured ?? false
    }));
  });
  const FEATURED_SOCIALS_MAX = 5;
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [isEditingExtras, setIsEditingExtras] = useState(false);
  const [profileMoodText, setProfileMoodText] = useState(initialStats?.profileMoodText ?? '');
  const [profileMoodEmoji, setProfileMoodEmoji] = useState(initialStats?.profileMoodEmoji ?? '');
  const [profileHeadline, setProfileHeadline] = useState(initialStats?.profileHeadline ?? '');
  const [profileSongUrl, setProfileSongUrl] = useState(initialStats?.profileSongUrl ?? '');
  const [profileSongProvider, setProfileSongProvider] = useState(initialStats?.profileSongProvider ?? '');
  const [profileSongAutoplay, setProfileSongAutoplay] = useState(Boolean(initialStats?.profileSongAutoplayEnabled));
  const [extrasStatus, setExtrasStatus] = useState({ type: 'idle', message: null });
  const avatarInitialState = useMemo(() => {
    if (!user?.avatar_state) return null;
    try {
      return JSON.parse(user.avatar_state);
    } catch (error) {
      console.warn('Failed to parse avatar_state', error);
      return null;
    }
  }, [user?.avatar_state]);

  const handleTabChange = (tab) => {
    router.push(`/account?tab=${tab}`, { scroll: false });
  };

  const accountMoodDescriptor = stats
    ? (stats.profileMoodText?.trim() || stats.profileMoodEmoji?.trim() || '')
    : '';
  const accountMoodChipStyle = getMoodChipStyle(accountMoodDescriptor);

  // Refresh stats when tab becomes active or on focus
  useEffect(() => {
    if (activeTab === 'profile' && user) {
      const refreshStats = async () => {
        try {
          const res = await fetch('/api/account/stats');
          if (res.ok) {
            const data = await res.json();
            const apiHasExtras =
              (data.profileSongUrl != null && data.profileSongUrl !== '') ||
              (data.profileMoodText != null && data.profileMoodText !== '');
            setStats((prev) => {
              if (apiHasExtras) return data;
              if (!prev) return data;
              return {
                ...data,
                profileMoodText: prev.profileMoodText ?? '',
                profileMoodEmoji: prev.profileMoodEmoji ?? '',
                profileHeadline: prev.profileHeadline ?? '',
                profileSongUrl: prev.profileSongUrl ?? '',
                profileSongProvider: prev.profileSongProvider ?? '',
                profileSongAutoplayEnabled: prev.profileSongAutoplayEnabled ?? false,
              };
            });
            // If stats didn't return mood/song, try GET profile-extras (reads DB directly) and merge
            if (!apiHasExtras) {
              try {
                const extrasRes = await fetch('/api/account/profile-extras');
                if (extrasRes.ok) {
                  const extras = await extrasRes.json();
                  const hasExtras = (extras.profileSongUrl ?? '') !== '' || (extras.profileMoodText ?? '') !== '';
                  if (hasExtras) {
                    setStats((prev) => prev ? { ...prev, ...extras } : prev);
                    setProfileMoodText(extras.profileMoodText ?? '');
                    setProfileMoodEmoji(extras.profileMoodEmoji ?? '');
                    setProfileHeadline(extras.profileHeadline ?? '');
                    setProfileSongUrl(extras.profileSongUrl ?? '');
                    setProfileSongProvider(extras.profileSongProvider ?? '');
                    setProfileSongAutoplay(Boolean(extras.profileSongAutoplayEnabled));
                  }
                }
              } catch (_) {}
            }
            if (data.profileLinks) {
              const platforms = ['github', 'youtube', 'soundcloud', 'discord', 'chatgpt'];
              const linkMap = {};
              data.profileLinks.forEach(link => {
                if (typeof link === 'object' && link.platform && link.url) {
                  linkMap[link.platform] = { url: link.url, featured: Boolean(link.featured) };
                }
              });
              setSocialLinks(platforms.map(platform => ({
                platform,
                url: linkMap[platform]?.url || '',
                featured: linkMap[platform]?.featured ?? false
              })));
            }
          }
        } catch (e) {
          // Silently fail - stats will just be stale
        }
      };

      // Refresh on mount
      refreshStats();

      // Refresh on window focus
      const handleFocus = () => refreshStats();
      window.addEventListener('focus', handleFocus);

      // Optional: Poll every 60 seconds when tab is active
      const interval = setInterval(refreshStats, 60000);

      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(interval);
      };
    }
  }, [activeTab, user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (Object.keys(openDropdowns).length > 0) {
        const isClickInside = event.target.closest('[data-dropdown-container]');
        if (!isClickInside) {
          closeAllDropdowns();
        }
      }
    };

    if (Object.keys(openDropdowns).length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openDropdowns]);

  useEffect(() => {
    if (!isEditingAvatar) {
      return;
    }
    let active = true;
    const sendPing = (initial = false) => {
      if (!active && !initial) return;
      fetch('/api/account/avatar-edit-time', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial })
      }).catch(() => {});
    };

    sendPing(true);
    const interval = setInterval(() => sendPing(false), 60000);
    return () => {
      sendPing(false);
      active = false;
      clearInterval(interval);
    };
  }, [isEditingAvatar]);

  const handleSaveUsername = async (e) => {
    e?.preventDefault?.();
    const trimmed = (newUsername || '').trim();
    if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) {
      setUsernameStatus({ type: 'error', message: 'Username must be 3–20 characters (lowercase letters, numbers, underscores).' });
      return;
    }
    setNewUsername(trimmed);
    setUsernameStatus({ type: 'loading', message: 'Saving...' });

    const usernameChanged = trimmed !== (user?.username || '');
    const colorChanged = selectedColorIndex !== (user?.preferred_username_color_index ?? null);

    if (!usernameChanged && !colorChanged) {
      handleCancelUsername();
      return;
    }

    try {
      if (usernameChanged) {
        const fd = new FormData();
        fd.append('username', trimmed);
        const res = await fetch('/api/account/username', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) {
          setUsernameStatus({ type: 'error', message: data.error || 'Failed to update username' });
          return;
        }
      }
      if (colorChanged) {
        const fd = new FormData();
        fd.append('color_index', selectedColorIndex === null ? '' : String(selectedColorIndex));
        const res = await fetch('/api/account/username-color', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) {
          setUsernameStatus({ type: 'error', message: data.error || 'Failed to update color' });
          return;
        }
      }
      setUsernameStatus({ type: 'success', message: 'Profile updated!' });
      setIsEditingUsername(false);
      setTimeout(() => {
        setUsernameStatus({ type: 'idle', message: null });
        router.refresh();
      }, 1000);
    } catch (err) {
      setUsernameStatus({ type: 'error', message: 'Network error. Please try again.' });
    }
  };

  const handleSaveSocials = async (e) => {
    e?.preventDefault?.();
    setUsernameStatus({ type: 'loading', message: 'Saving...' });

    // Check if social links changed (use current stats, not initialStats, to account for background refreshes)
    const currentLinks = stats?.profileLinks || [];
    const linksToSave = socialLinks
      .filter(link => link.url.trim())
      .map(link => ({ platform: link.platform, url: link.url.trim(), featured: Boolean(link.featured) }));
    
    // Normalize current links to same format
    const normalizedCurrentLinks = Array.isArray(currentLinks) 
      ? currentLinks
          .filter(link => typeof link === 'object' && link.platform && link.url)
          .map(link => ({ platform: link.platform, url: link.url.trim(), featured: Boolean(link.featured) }))
      : [];
    
    const linksChanged = JSON.stringify(linksToSave.sort((a, b) => a.platform.localeCompare(b.platform))) !== 
                         JSON.stringify(normalizedCurrentLinks.sort((a, b) => a.platform.localeCompare(b.platform)));

    if (!linksChanged) {
      handleCancelSocials();
      return;
    }

    try {
      const fd = new FormData();
      fd.append('links', JSON.stringify(linksToSave));
      const res = await fetch('/api/account/social-links', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUsernameStatus({ type: 'error', message: data.error || 'Failed to update social links' });
        return;
      }
      setUsernameStatus({ type: 'success', message: 'Social links updated!' });
      setIsEditingSocials(false);
      setTimeout(() => {
        setUsernameStatus({ type: 'idle', message: null });
        router.refresh();
      }, 1000);
    } catch (err) {
      setUsernameStatus({ type: 'error', message: 'Network error. Please try again.' });
    }
  };

  const handleAvatarSave = async (svgPayload, avatarState) => {
    const payload = typeof svgPayload === 'string'
      ? { svg: svgPayload, encoding: undefined }
      : svgPayload;
    try {
      const res = await fetch('/api/account/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          svg: payload.svg,
          state: avatarState,
          encoding: payload.encoding
        })
      });
      if (res.ok) {
        setIsEditingAvatar(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save avatar');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const handleCancelUsername = () => {
    setNewUsername(user?.username || '');
    setSelectedColorIndex(user?.preferred_username_color_index ?? null);
    setUsernameStatus({ type: 'idle', message: null });
    setColorStatus({ type: 'idle', message: null });
    setIsEditingUsername(false);
  };

  const handleCancelSocials = () => {
    setUsernameStatus({ type: 'idle', message: null });
    setColorStatus({ type: 'idle', message: null });
    setIsEditingSocials(false);
    const links = initialStats?.profileLinks || [];
    const platforms = ['github', 'youtube', 'soundcloud', 'discord', 'chatgpt'];
    const linkMap = {};
    links.forEach(link => {
      if (typeof link === 'object' && link.platform && link.url) {
        linkMap[link.platform] = { url: link.url, featured: Boolean(link.featured) };
      }
    });
    setSocialLinks(platforms.map(platform => ({
      platform,
      url: linkMap[platform]?.url || '',
      featured: linkMap[platform]?.featured ?? false
    })));
  };

  const handleSaveExtras = async (e) => {
    e?.preventDefault?.();
    setExtrasStatus({ type: 'loading', message: null });
    const songUrlTrimmed = (profileSongUrl ?? '').trim();
    if (songUrlTrimmed) {
      try {
        new URL(songUrlTrimmed);
      } catch (_) {
        setExtrasStatus({ type: 'error', message: 'Please enter a valid song URL (e.g. https://soundcloud.com/... or https://www.youtube.com/...)' });
        return;
      }
    }
    try {
      const res = await fetch('/api/account/profile-extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_mood_text: (profileMoodText ?? '').trim(),
          profile_mood_emoji: (profileMoodEmoji ?? '').trim(),
          profile_headline: (profileHeadline ?? '').trim(),
          profile_song_url: (profileSongUrl ?? '').trim(),
          profile_song_provider: (profileSongProvider ?? '').trim() || null,
          profile_song_autoplay_enabled: profileSongAutoplay,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || 'Save failed';
        const hint = data.hint ? ` ${data.hint}` : '';
        setExtrasStatus({ type: 'error', message: msg + hint });
        return;
      }
      setExtrasStatus({ type: 'success', message: 'Saved.' });
      setIsEditingExtras(false);
      const moodText = data.profileMoodText ?? (profileMoodText ?? '').trim();
      const moodEmoji = data.profileMoodEmoji ?? (profileMoodEmoji ?? '').trim();
      const headline = data.profileHeadline ?? (profileHeadline ?? '').trim();
      const songUrl = data.profileSongUrl ?? (profileSongUrl ?? '').trim();
      const songProvider = (data.profileSongProvider ?? (profileSongProvider ?? '').trim()) || null;
      const savedAutoplay = data.profileSongAutoplayEnabled !== undefined ? data.profileSongAutoplayEnabled : profileSongAutoplay;
      setStats((prev) => ({
        ...prev,
        profileMoodText: moodText,
        profileMoodEmoji: moodEmoji,
        profileHeadline: headline,
        profileSongUrl: songUrl,
        profileSongProvider: songProvider,
        profileSongAutoplayEnabled: savedAutoplay,
      }));
      setProfileMoodText(moodText);
      setProfileMoodEmoji(moodEmoji);
      setProfileHeadline(headline);
      setProfileSongUrl(songUrl);
      setProfileSongProvider(songProvider || '');
      setProfileSongAutoplay(savedAutoplay);
      const refreshRes = await fetch('/api/account/stats');
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        setStats((prev) => {
          const next = { ...refreshed };
          const apiHasExtras =
            (refreshed.profileSongUrl != null && refreshed.profileSongUrl !== '') ||
            (refreshed.profileMoodText != null && refreshed.profileMoodText !== '');
          if (!apiHasExtras && prev) {
            next.profileMoodText = prev.profileMoodText ?? '';
            next.profileMoodEmoji = prev.profileMoodEmoji ?? '';
            next.profileHeadline = prev.profileHeadline ?? '';
            next.profileSongUrl = prev.profileSongUrl ?? '';
            next.profileSongProvider = prev.profileSongProvider ?? '';
            next.profileSongAutoplayEnabled = prev.profileSongAutoplayEnabled ?? false;
          }
          return next;
        });
        const finalMoodText = refreshed.profileMoodText ?? moodText;
        const finalMoodEmoji = refreshed.profileMoodEmoji ?? moodEmoji;
        const finalHeadline = refreshed.profileHeadline ?? headline;
        const finalSongUrl = refreshed.profileSongUrl ?? songUrl;
        const finalSongProvider = refreshed.profileSongProvider ?? songProvider;
        const finalAutoplay = refreshed.profileSongAutoplayEnabled !== undefined ? refreshed.profileSongAutoplayEnabled : profileSongAutoplay;
        setProfileMoodText(finalMoodText);
        setProfileMoodEmoji(finalMoodEmoji);
        setProfileHeadline(finalHeadline);
        setProfileSongUrl(finalSongUrl);
        setProfileSongProvider(finalSongProvider ?? '');
        setProfileSongAutoplay(Boolean(finalAutoplay));
      }
      setTimeout(() => setExtrasStatus({ type: 'idle', message: null }), 2000);
    } catch (err) {
      setExtrasStatus({ type: 'error', message: 'Network error' });
    }
  };

  const handleCancelExtras = () => {
    setExtrasStatus({ type: 'idle', message: null });
    setIsEditingExtras(false);
    setProfileMoodText(stats?.profileMoodText ?? '');
    setProfileMoodEmoji(stats?.profileMoodEmoji ?? '');
    setProfileHeadline(stats?.profileHeadline ?? '');
    setProfileSongUrl(stats?.profileSongUrl ?? '');
    setProfileSongProvider(stats?.profileSongProvider ?? '');
    setProfileSongAutoplay(Boolean(stats?.profileSongAutoplayEnabled));
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

  const socialPlatforms = [
    { value: 'github', label: 'GitHub' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'soundcloud', label: 'SoundCloud' },
    { value: 'discord', label: 'Discord' },
    { value: 'chatgpt', label: 'ChatGPT' },
  ];

  const toggleDropdown = (index) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const closeAllDropdowns = () => {
    setOpenDropdowns({});
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
        // For user profiles, extract username from URL if possible
        if (pathname.startsWith('/users/')) {
          return pathname.slice(7);
        } else if (pathname.startsWith('/gg/')) {
          return pathname.slice(4);
        }
        // For invite links, return the invite code
        return null;
      } else if (platform === 'chatgpt') {
        // ChatGPT: https://chat.openai.com/g/g-xxx or https://chatgpt.com/share/xxx
        // Extract share ID or conversation ID
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
    if (t === 'post_comment' && postType) return map[postType] || 'Posts';
    return map[t] || 'Forum';
  };

  const activityItems = useMemo(() => {
    const recent = stats?.recentActivity || [];
    return recent.map((item) => {
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
  }, [stats?.recentActivity]);

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

  const handleSocialLinkChange = (index, field, value) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const tabBase = {
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid rgba(52, 225, 255, 0.2)',
    borderRadius: '8px',
    borderBottom: '1px solid rgba(52, 225, 255, 0.2)',
    cursor: 'pointer',
    fontSize: '15px',
    whiteSpace: 'nowrap',
    width: '100%',
    textAlign: 'center',
    boxSizing: 'border-box'
  };

  const EDIT_PROFILE_SUB_TABS = [
    { id: 'activity', label: 'Activity' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'guestbook', label: 'Notes' },
    { id: 'mood', label: 'Mood & Song' },
    { id: 'socials', label: 'Socials' },
    { id: 'stats', label: 'Stats' },
  ];
  const [editProfileSubTab, setEditProfileSubTab] = useState('activity');
  const editProfileSubTabIndex = EDIT_PROFILE_SUB_TABS.findIndex(t => t.id === editProfileSubTab);
  const roleLabel = user?.role === 'admin' ? 'Drip Warden' : user?.role === 'mod' ? 'Drip Guardian' : 'Drip';
  const roleColor = user?.role === 'admin' ? 'var(--role-admin)' : user?.role === 'mod' ? 'var(--role-mod)' : 'var(--role-user)';
  const [defaultProfileTab, setDefaultProfileTab] = useState(stats?.defaultProfileTab ?? null);
  const [defaultTabSaving, setDefaultTabSaving] = useState(false);
  const [guestbookEntries, setGuestbookEntries] = useState([]);
  const [guestbookDeletingId, setGuestbookDeletingId] = useState(null);
  useEffect(() => {
    if (stats?.defaultProfileTab !== undefined) setDefaultProfileTab(stats.defaultProfileTab ?? null);
  }, [stats?.defaultProfileTab]);
  useEffect(() => {
    if (editProfileSubTab !== 'guestbook' || !user?.username) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/user/${encodeURIComponent(user.username)}/guestbook`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && data.entries) setGuestbookEntries(data.entries);
      } catch (_) {
        if (!cancelled) setGuestbookEntries([]);
      }
    })();
    return () => { cancelled = true; };
  }, [editProfileSubTab, user?.username]);
  const handleGuestbookDelete = async (id) => {
    if (!id || guestbookDeletingId) return;
    setGuestbookDeletingId(id);
    try {
      const res = await fetch(`/api/account/guestbook/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) setGuestbookEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setGuestbookDeletingId(null);
    }
  };

  const GALLERY_MAX = 10;
  const GALLERY_COLS = 5;
  const [galleryEntries, setGalleryEntries] = useState([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryDeletingId, setGalleryDeletingId] = useState(null);
  const [galleryCoverId, setGalleryCoverId] = useState(null);
  const [galleryModalEntry, setGalleryModalEntry] = useState(null);
  const [galleryUploadError, setGalleryUploadError] = useState(null);
  const displayedGalleryEntries = galleryEntries.slice(0, GALLERY_MAX);
  useEffect(() => {
    if (editProfileSubTab !== 'gallery') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/account/gallery');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && data.entries) setGalleryEntries(data.entries);
      } catch (_) {
        if (!cancelled) setGalleryEntries([]);
      }
    })();
    return () => { cancelled = true; };
  }, [editProfileSubTab]);
  const handleGalleryUpload = async (e) => {
    e.preventDefault();
    setGalleryUploadError(null);
    const form = e.target;
    const fileInput = form.querySelector('input[type="file"]');
    const captionInput = form.querySelector('input[name="caption"]');
    if (!fileInput?.files?.length || galleryUploading) return;
    if (galleryEntries.length >= GALLERY_MAX) {
      setGalleryUploadError('Gallery limited to 10 uploads.');
      return;
    }
    const file = fileInput.files[0];
    setGalleryUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (captionInput?.value?.trim()) fd.append('caption', captionInput.value.trim());
      const res = await fetch('/api/account/gallery', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.entry) {
        setGalleryEntries((prev) => [...prev, data.entry].slice(0, GALLERY_MAX));
        form.reset();
      } else {
        setGalleryUploadError(data.error || 'Upload failed');
      }
    } catch (_) {
      setGalleryUploadError('Upload failed');
    } finally {
      setGalleryUploading(false);
    }
  };
  const handleGalleryDelete = async (id) => {
    if (!id || galleryDeletingId) return;
    setGalleryDeletingId(id);
    try {
      const res = await fetch(`/api/account/gallery/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) setGalleryEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setGalleryDeletingId(null);
    }
  };
  const handleGallerySetCover = async (id) => {
    if (!id || galleryCoverId) return;
    setGalleryCoverId(id);
    try {
      const res = await fetch(`/api/account/gallery/${encodeURIComponent(id)}`, { method: 'PATCH' });
      if (res.ok) setGalleryEntries((prev) => prev.map((e) => ({ ...e, is_cover: e.id === id })));
    } finally {
      setGalleryCoverId(null);
    }
  };
  const handleDefaultTabChange = async (value) => {
    const v = value === 'none' || value === '' ? null : value;
    const previous = stats?.defaultProfileTab ?? null;
    setDefaultTabSaving(true);
    try {
      const res = await fetch('/api/account/default-profile-tab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_profile_tab: v }),
      });
      if (res.ok) {
        const data = await res.json();
        const saved = data.default_profile_tab ?? null;
        setDefaultProfileTab(saved);
        setStats(prev => prev ? { ...prev, defaultProfileTab: saved } : prev);
      } else {
        setDefaultProfileTab(previous);
      }
    } catch (_) {
      setDefaultProfileTab(previous);
    } finally {
      setDefaultTabSaving(false);
    }
  };
  return (
    <section className="card account-card neon-outline-card">
      <div
        className="account-tabs"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '12px',
          marginBottom: activeTab === 'profile' ? '8px' : '16px',
          width: '100%',
          minWidth: 0
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('account')}
          style={{
            ...tabBase,
            borderBottom: activeTab === 'account' ? '3px solid var(--accent)' : '1px solid rgba(52, 225, 255, 0.2)',
            color: activeTab === 'account' ? 'var(--accent)' : 'var(--muted)',
            fontWeight: activeTab === 'account' ? '600' : '400'
          }}
        >
          Account
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          style={{
            ...tabBase,
            borderBottom: activeTab === 'profile' ? '3px solid var(--accent)' : '1px solid rgba(52, 225, 255, 0.2)',
            color: activeTab === 'profile' ? 'var(--accent)' : 'var(--muted)',
            fontWeight: activeTab === 'profile' ? '600' : '400'
          }}
        >
          Edit profile
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
          
          {/* Sign out button at bottom of Account tab */}
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } catch (error) {
                  // ignore
                }
                // Redirect to forum.errl.wtf (sign-in screen)
                window.location.href = 'https://forum.errl.wtf';
              }}
              style={{ width: '100%' }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {activeTab === 'profile' && user && stats && (
        <div style={{ minWidth: 0, maxWidth: '100%' }}>
          <div className="account-edit-card account-edit-card--tabs-bottom neon-outline-card">
            {/* Layout: Row 1 = avatar + mini preview + Edit Avatar (right). Row 2 = username + Edit Username (right). Then role, mood, song, headline. */}
            <div className="account-profile-preview">
              <div className="account-profile-preview-left-column">
                <div className="account-profile-preview-avatar-container">
                  {user.avatar_key ? (
                    <AvatarImage src={getAvatarUrl(user.avatar_key)} alt="" size={96} loading="eager" />
                  ) : (
                    <div className="no-avatar-placeholder">No avatar</div>
                  )}
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mini preview</span>
                    <AvatarImage src={getAvatarUrl(user.avatar_key)} alt="" size={24} loading="lazy" />
                  </div>
                </div>

                <div className="account-profile-preview-user-info">
                  <Username name={user.username} colorIndex={getUsernameColorIndex(user.username, { preferredColorIndex: user.preferred_username_color_index })} avatarKey={undefined} href={null} style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: '700' }} />
                  <div style={{ color: roleColor, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{roleLabel}</div>
                  {(stats.profileMoodText || stats.profileMoodEmoji) && (
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <span style={{color: 'var(--muted)', fontSize: '13px'}}>Mood:</span>
                      <div className="profile-mood-chip" style={accountMoodChipStyle}>
                        <span>{stats.profileMoodEmoji}{stats.profileMoodEmoji ? ' ' : ''}{stats.profileMoodText}</span>
                      </div>
                    </div>
                  )}
                  {stats.profileHeadline && (
                    <div style={{ fontSize: '14px', color: 'var(--ink)', marginTop: '8px' }}>
                      <span style={{ color: 'var(--muted)' }}>Headline:</span> {stats.profileHeadline}
                    </div>
                  )}
                  {(stats.profileSongUrl || stats.profileSongProvider) && (
                    <div style={{ fontSize: '13px', color: 'var(--ink)', marginTop: '6px' }}>
                      <span style={{ color: 'var(--muted)' }}>Song:</span>{' '}
                      <span style={{ color: 'var(--accent)' }}>
                        {stats.profileSongProvider ? stats.profileSongProvider.charAt(0).toUpperCase() + stats.profileSongProvider.slice(1) : 'Song'}
                      </span>{' '}
                      {stats.profileSongUrl ? (
                        <a href={stats.profileSongUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)' }}>
                          {stats.profileSongUrl}
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="account-profile-preview-right-column">
                <div className="account-profile-preview-buttons-container">
                  <button
                    type="button"
                    onClick={() => { setIsEditingUsername(true); setIsEditingAvatar(false); setIsEditingSocials(false); setIsEditingExtras(false); }}
                    className="account-edit-profile-btn account-edit-profile-btn--small account-edit-username-btn"
                  >
                    Edit Username
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEditingAvatar(true); setIsEditingUsername(false); setIsEditingSocials(false); setIsEditingExtras(false); }}
                    disabled={isEditingAvatar}
                    className="account-edit-profile-btn account-edit-profile-btn--small account-edit-avatar-btn"
                  >
                    Edit Avatar
                  </button>
                </div>
              </div>
            </div>

            {isEditingUsername && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '0px', alignSelf: 'center' }}>
                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="username" pattern="[a-z0-9_]{3,20}" style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--ink)', fontSize: '14px', minWidth: '120px' }} />
                    <button type="button" onClick={handleSaveUsername} disabled={usernameStatus.type === 'loading'} style={{ fontSize: '12px', padding: '6px 12px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: 'var(--bg)', cursor: usernameStatus.type === 'loading' ? 'not-allowed' : 'pointer' }}>{usernameStatus.type === 'loading' ? 'Saving…' : 'Save'}</button>
                    <button type="button" onClick={handleCancelUsername} disabled={usernameStatus.type === 'loading'} style={{ fontSize: '12px', padding: '6px 12px', background: 'transparent', border: '1px solid rgba(52, 225, 255, 0.3)', borderRadius: '6px', color: 'var(--muted)', cursor: 'pointer' }}>Cancel</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {colorOptions.map((option) => {
                        const isSelected = selectedColorIndex === option.index;
                        const disabled = usernameStatus.type === 'loading';
                        return (
                        <button key={option.index ?? 'auto'} type="button" onClick={() => !disabled && setSelectedColorIndex(option.index)} disabled={disabled} title={option.name} className="color-picker-btn" style={{ minHeight: 0, width: 18, height: 18, borderRadius: '50%', border: isSelected ? '2px solid var(--accent)' : '1px solid rgba(52, 225, 255, 0.3)', background: option.index === null ? 'repeating-linear-gradient(45deg, rgba(52, 225, 255, 0.3), rgba(52, 225, 255, 0.3) 4px, transparent 4px, transparent 8px)' : option.color, cursor: disabled ? 'default' : 'pointer', padding: 0 }} />
                        );
                    })}
                </div>
                {usernameStatus.message && (usernameStatus.type === 'error' || usernameStatus.type === 'success') && <span style={{ fontSize: '12px', color: usernameStatus.type === 'error' ? '#ff6b6b' : '#00f5a0', marginTop: '4px', display: 'block', textAlign: 'center' }}>{usernameStatus.message}</span>}
              </div>
            )}
            {isEditingAvatar && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                <AvatarCustomizer onSave={handleAvatarSave} onCancel={() => setIsEditingAvatar(false)} initialState={avatarInitialState} key={user?.avatar_state || 'avatar-empty'} />
              </div>
            )}

            {editProfileSubTab && (
            <div className="account-edit-tab-content account-edit-tab-content--above">
              {editProfileSubTab === 'mood' && (
                <div className="account-edit-panel">
                <h2 className="section-title" style={{ margin: 0 }}>Mood & Song</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                  <span className="muted" style={{ fontSize: '13px' }}>Shown on your public profile header.</span>
                  <button
                    type="button"
                    onClick={() => { setIsEditingExtras(true); setIsEditingUsername(false); setIsEditingSocials(false); setUsernameStatus({ type: 'idle', message: null }); setColorStatus({ type: 'idle', message: null }); }}
                    disabled={isEditingExtras}
                    style={{ borderRadius: '999px', border: 'none', background: isEditingExtras ? 'rgba(52, 225, 255, 0.3)' : 'linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9))', color: '#001018', cursor: isEditingExtras ? 'default' : 'pointer', fontSize: '12px', fontWeight: '600', padding: '2px 10px', lineHeight: '1.2', opacity: isEditingExtras ? 0.6 : 1 }}
                  >
                    {isEditingExtras ? 'Editing…' : 'Edit Mood & Song'}
                  </button>
                </div>
                {!isEditingExtras ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    {(profileMoodText || profileMoodEmoji) && <div><span style={{ color: 'var(--muted)' }}>Mood:</span> <span>{profileMoodEmoji}{profileMoodEmoji ? ' ' : ''}{profileMoodText}</span></div>}
                    {profileHeadline && <div><span style={{ color: 'var(--muted)' }}>Headline:</span> <span>{profileHeadline}</span></div>}
                    {(profileSongUrl || profileSongProvider) && <div><span style={{ color: 'var(--muted)' }}>Song:</span> <span>{profileSongProvider ? profileSongProvider.charAt(0).toUpperCase() + profileSongProvider.slice(1) : ''} {profileSongUrl ? <a href={profileSongUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{profileSongUrl}</a> : ''}</span> {profileSongAutoplay && <span style={{ color: 'var(--muted)', fontSize: '11px' }}> (autoplay on)</span>}</div>}
                    {!profileMoodText && !profileMoodEmoji && !profileHeadline && !profileSongUrl && <div className="muted" style={{ fontSize: '12px' }}>No mood or song set. Click Edit to add.</div>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Mood</label>
                      <select
                        value={MOOD_OPTIONS.some(o => o.text === profileMoodText && o.emoji === profileMoodEmoji) ? MOOD_OPTIONS.find(o => o.text === profileMoodText && o.emoji === profileMoodEmoji).value : (profileMoodText || profileMoodEmoji ? 'custom' : '')}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === 'custom') return;
                          const opt = MOOD_OPTIONS.find(o => o.value === v);
                          if (opt) { setProfileMoodText(opt.text); setProfileMoodEmoji(opt.emoji); }
                        }}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--ink)', fontSize: '13px' }}
                      >
                        <option value="">None</option>
                        {profileMoodText || profileMoodEmoji ? (MOOD_OPTIONS.every(o => o.text !== profileMoodText || o.emoji !== profileMoodEmoji) ? <option value="custom">{profileMoodEmoji}{profileMoodEmoji ? ' ' : ''}{profileMoodText || 'Custom'}</option> : null) : null}
                        {MOOD_OPTIONS.filter(o => o.value).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.emoji}{opt.emoji ? ' ' : ''}{opt.text}</option>
                        ))}
                      </select>
                    </div>
                    <div><label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Headline (optional)</label><input type="text" value={profileHeadline} onChange={(e) => setProfileHeadline(e.target.value)} placeholder="Short tagline" maxLength={300} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--ink)', fontSize: '13px' }} /></div>
                    <div><label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Song URL</label><input type="url" value={profileSongUrl} onChange={(e) => setProfileSongUrl(e.target.value)} placeholder="https://soundcloud.com/..." style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--ink)', fontSize: '13px' }} /></div>
                    <div><label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Song provider</label><select value={profileSongProvider || ''} onChange={(e) => setProfileSongProvider(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--ink)', fontSize: '13px' }}><option value="">—</option><option value="soundcloud">SoundCloud</option><option value="spotify">Spotify</option><option value="youtube">YouTube</option></select></div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}><input type="checkbox" checked={profileSongAutoplay} onChange={(e) => setProfileSongAutoplay(e.target.checked)} /><span>Autoplay song on profile (off by default)</span></label>
                  </div>
                )}
                {isEditingExtras && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%', marginTop: '8px' }}>
                    <button type="button" onClick={handleSaveExtras} disabled={extrasStatus.type === 'loading'} style={{ fontSize: '12px', padding: '6px 12px', flex: '1 1 auto', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: 'var(--bg)', cursor: extrasStatus.type === 'loading' ? 'not-allowed' : 'pointer', opacity: extrasStatus.type === 'loading' ? 0.6 : 1, whiteSpace: 'nowrap' }}>{extrasStatus.type === 'loading' ? 'Saving…' : 'Save'}</button>
                    <button type="button" onClick={handleCancelExtras} disabled={extrasStatus.type === 'loading'} style={{ fontSize: '12px', padding: '6px 12px', flex: '1 1 auto', background: 'transparent', border: '1px solid rgba(52, 225, 255, 0.3)', borderRadius: '6px', color: 'var(--muted)', cursor: extrasStatus.type === 'loading' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>Cancel</button>
                  </div>
                )}
                {extrasStatus.message && <div style={{ fontSize: '12px', color: (extrasStatus.type === 'error') ? '#ff6b6b' : (extrasStatus.type === 'success') ? '#00f5a0' : 'var(--muted)' }}>{extrasStatus.message}</div>}
                </div>
              )}

              {editProfileSubTab === 'socials' && (
                <div className="account-edit-panel">
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <h2 className="section-title" style={{ margin: 0, marginBottom: 0 }}>Socials</h2>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={defaultProfileTab === 'socials'} onChange={(e) => handleDefaultTabChange(e.target.checked ? 'socials' : 'none')} disabled={defaultTabSaving} style={{ margin: 0 }} />
                    <span>Set as profile default</span>
                  </label>
                </div>
                <p className="muted" style={{ fontSize: '12px', marginBottom: '4px' }}>These links appear on your profile in the Socials tab (Lately).</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    {/* Social Links Display - only show when NOT editing socials */}
                    {!isEditingSocials && stats?.profileLinks && stats.profileLinks.length > 0 && (
                      <div>
                        <strong>Socials:</strong>
                        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                        {stats.profileLinks.map((link) => {
                          if (typeof link !== 'object' || !link.platform || !link.url) return null;
                          const platformData = socialPlatforms.find(p => p.value === link.platform);
                          if (!platformData) return null;
                          const username = extractUsername(link.platform, link.url);
                          const isSoundCloud = link.platform === 'soundcloud';
                          return (
                            <a
                              key={link.platform}
                              href={link.url}
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
                              title={platformData.label}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isSoundCloud 
                                  ? 'rgba(255, 107, 0, 0.15)' 
                                  : 'rgba(52, 225, 255, 0.15)';
                                e.currentTarget.style.borderColor = isSoundCloud 
                                  ? 'rgba(255, 107, 0, 0.6)' 
                                  : 'rgba(52, 225, 255, 0.6)';
                                e.currentTarget.style.boxShadow = isSoundCloud 
                                  ? '0 0 12px rgba(255, 107, 0, 0.4)' 
                                  : '0 0 12px rgba(52, 225, 255, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isSoundCloud 
                                  ? 'rgba(255, 107, 0, 0.05)' 
                                  : 'rgba(52, 225, 255, 0.05)';
                                e.currentTarget.style.borderColor = isSoundCloud 
                                  ? 'rgba(255, 107, 0, 0.3)' 
                                  : 'rgba(52, 225, 255, 0.3)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {getPlatformIcon(link.platform)}
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

                    {/* Social Media Links - only show when editing socials */}
                    {isEditingSocials && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        <strong style={{ fontSize: '14px' }}>Social Links:</strong>
                        <p className="muted" style={{ fontSize: '12px', marginTop: '-2px' }}>Check &quot;Show on profile card&quot; to display up to {FEATURED_SOCIALS_MAX} links on your main profile card.</p>
                        {socialLinks.map((link, index) => {
                          const featuredCount = socialLinks.filter(l => l.featured).length;
                          const atFeaturedMax = featuredCount >= FEATURED_SOCIALS_MAX && !link.featured;
                          return (
                          <div key={link.platform} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', position: 'relative' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }} data-dropdown-container>
                              <button
                                type="button"
                                onClick={() => toggleDropdown(index)}
                                disabled={usernameStatus.type === 'loading'}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(52, 225, 255, 0.3)',
                                  background: 'rgba(2, 7, 10, 0.6)',
                                  color: 'var(--ink)',
                                  fontSize: '11px',
                                  width: '100px',
                                  cursor: usernameStatus.type === 'loading' ? 'not-allowed' : 'pointer',
                                  opacity: usernameStatus.type === 'loading' ? 0.6 : 1,
                                  justifyContent: 'space-between'
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
                                  {getPlatformIcon(link.platform)}
                                  <span style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {socialPlatforms.find(p => p.value === link.platform)?.label || link.platform}
                                  </span>
                                </span>
                                <span style={{ fontSize: '9px', opacity: 0.7, flexShrink: 0 }}>▼</span>
                              </button>
                              {openDropdowns[index] && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    zIndex: 1000,
                                    marginTop: '4px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(52, 225, 255, 0.3)',
                                    background: 'rgba(2, 7, 10, 0.95)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                    minWidth: '100px',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {socialPlatforms.map(platform => (
                                    <button
                                      key={platform.value}
                                      type="button"
                                      onClick={() => {
                                        handleSocialLinkChange(index, 'platform', platform.value);
                                        toggleDropdown(index);
                                      }}
                                      disabled={usernameStatus.type === 'loading'}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        width: '100%',
                                        padding: '6px 8px',
                                        border: 'none',
                                        background: link.platform === platform.value ? 'rgba(52, 225, 255, 0.2)' : 'transparent',
                                        color: 'var(--ink)',
                                        fontSize: '11px',
                                        cursor: usernameStatus.type === 'loading' ? 'not-allowed' : 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (usernameStatus.type !== 'loading') {
                                          e.currentTarget.style.background = 'rgba(52, 225, 255, 0.15)';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = link.platform === platform.value ? 'rgba(52, 225, 255, 0.2)' : 'transparent';
                                      }}
                                    >
                                      {getPlatformIcon(platform.value)}
                                      <span>{platform.label}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                              placeholder="https://..."
                              disabled={usernameStatus.type === 'loading'}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid rgba(52, 225, 255, 0.3)',
                                background: 'rgba(2, 7, 10, 0.6)',
                                color: 'var(--ink)',
                                fontSize: '13px',
                                flex: '1 1 auto',
                                minWidth: 0
                              }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)', cursor: usernameStatus.type === 'loading' ? 'default' : 'pointer', flexShrink: 0 }}>
                              <input
                                type="checkbox"
                                checked={link.featured || false}
                                onChange={(e) => { if (e.target.checked && atFeaturedMax) return; handleSocialLinkChange(index, 'featured', e.target.checked); }}
                                disabled={usernameStatus.type === 'loading'}
                                style={{ margin: 0 }}
                              />
                              <span>Show on profile card{atFeaturedMax ? ' (max reached)' : ''}</span>
                            </label>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingSocials(true);
                      setIsEditingUsername(false);
                      setIsEditingExtras(false);
                      setNewUsername(user.username);
                      setSelectedColorIndex(user.preferred_username_color_index ?? null);
                      setUsernameStatus({ type: 'idle', message: null });
                      setColorStatus({ type: 'idle', message: null });
                    }}
                    disabled={isEditingSocials}
                    title="Update your external frequency links"
                    style={{
                      borderRadius: '999px',
                      border: 'none',
                      background: 'linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9))',
                      color: '#001018',
                      cursor: isEditingSocials ? 'default' : 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s ease',
                      fontWeight: '600',
                      padding: '2px 10px',
                      lineHeight: '1.2',
                      opacity: isEditingSocials ? 0.6 : 1,
                      justifySelf: 'end',
                      boxShadow: '0 0 12px rgba(52, 225, 255, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isEditingSocials) {
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 0 18px rgba(255, 52, 245, 0.45)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isEditingSocials) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(52, 225, 255, 0.3)';
                      }
                    }}
                  >
                    Edit Socials
                  </button>
                </div>
                {isEditingSocials && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%', marginTop: '8px' }}>
                    <button type="button" onClick={handleSaveSocials} disabled={usernameStatus.type === 'loading'} style={{ fontSize: '12px', padding: '6px 12px', flex: '1 1 auto', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: 'var(--bg)', cursor: usernameStatus.type === 'loading' ? 'not-allowed' : 'pointer', opacity: usernameStatus.type === 'loading' ? 0.6 : 1, whiteSpace: 'nowrap' }}>{usernameStatus.type === 'loading' ? 'Saving…' : 'Save'}</button>
                    <button type="button" onClick={handleCancelSocials} disabled={usernameStatus.type === 'loading'} style={{ fontSize: '12px', padding: '6px 12px', flex: '1 1 auto', background: 'transparent', border: '1px solid rgba(52, 225, 255, 0.3)', borderRadius: '6px', color: 'var(--muted)', cursor: usernameStatus.type === 'loading' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>Cancel</button>
                  </div>
                )}
                {usernameStatus.message && editProfileSubTab === 'socials' && <div style={{ fontSize: '12px', color: (usernameStatus.type === 'error') ? '#ff6b6b' : (usernameStatus.type === 'success') ? '#00f5a0' : 'var(--muted)' }}>{usernameStatus.message}</div>}
                </div>
              )}

              {editProfileSubTab === 'gallery' && (
                <div className="account-edit-panel">
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <h2 className="section-title" style={{ margin: 0, marginBottom: 0 }}>Gallery</h2>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={defaultProfileTab === 'gallery'} onChange={(e) => handleDefaultTabChange(e.target.checked ? 'gallery' : 'none')} disabled={defaultTabSaving} style={{ margin: 0 }} />
                      <span>Set as profile default</span>
                    </label>
                  </div>
                  <p className="muted" style={{ fontSize: '13px', marginBottom: '6px' }}>Upload images for the Gallery tab (max {GALLERY_MAX}). You can set one as your cover photo.</p>
                  <form onSubmit={handleGalleryUpload} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                        <span style={{ color: '#F5FFB7', fontSize: '13px' }}>Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          required
                          disabled={galleryEntries.length >= GALLERY_MAX}
                          style={{ padding: '6px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--ink)', fontSize: '13px' }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                        <span style={{ color: '#F5FFB7', fontSize: '13px' }}>Caption (optional)</span>
                        <input
                          type="text"
                          name="caption"
                          placeholder="Caption"
                          maxLength={500}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--ink)', fontSize: '13px', minWidth: '140px' }}
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={galleryUploading || galleryEntries.length >= GALLERY_MAX}
                        style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'var(--bg)', fontSize: '13px', fontWeight: '600', cursor: galleryUploading || galleryEntries.length >= GALLERY_MAX ? 'not-allowed' : 'pointer', opacity: galleryUploading || galleryEntries.length >= GALLERY_MAX ? 0.7 : 1 }}
                      >
                        {galleryUploading ? 'Uploading…' : galleryEntries.length >= GALLERY_MAX ? 'Max 10' : 'Upload'}
                      </button>
                    </div>
                    {galleryUploadError && <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#ff6b6b' }}>{galleryUploadError}</p>}
                  </form>
                  {displayedGalleryEntries.length > 0 ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GALLERY_COLS}, 1fr)`, gap: '12px', maxWidth: '100%' }}>
                        {displayedGalleryEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="account-gallery-item"
                            style={{
                              position: 'relative',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              border: '1px solid rgba(52, 225, 255, 0.2)',
                              background: 'rgba(2, 7, 10, 0.35)',
                              aspectRatio: '1',
                              minWidth: 0,
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGalleryDelete(entry.id);
                              }}
                              disabled={galleryDeletingId === entry.id}
                              className="account-gallery-delete"
                              aria-label="Delete image"
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                width: '26px',
                                height: '26px',
                                borderRadius: '999px',
                                border: '1px solid rgba(255, 107, 0, 0.55)',
                                background: 'rgba(0, 0, 0, 0.6)',
                                color: '#ff6b6b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                cursor: galleryDeletingId === entry.id ? 'not-allowed' : 'pointer',
                                zIndex: 2,
                                transition: 'opacity 0.15s ease, transform 0.15s ease',
                              }}
                            >
                              {galleryDeletingId === entry.id ? '…' : '×'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setGalleryModalEntry(entry)}
                              style={{ width: '100%', height: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer', display: 'block', lineHeight: 0 }}
                              aria-label="View full size"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`/api/media/${entry.image_key}`} alt={entry.caption || 'Gallery'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            </button>
                            <div style={{ padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                              {entry.is_cover && <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600' }}>Cover</span>}
                              <button
                                type="button"
                                onClick={() => handleGallerySetCover(entry.id)}
                                disabled={entry.is_cover || galleryCoverId === entry.id}
                                style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'transparent', color: 'var(--muted)', cursor: entry.is_cover || galleryCoverId ? 'not-allowed' : 'pointer' }}
                              >
                                {galleryCoverId === entry.id ? '…' : 'Set cover'}
                              </button>
                            </div>
                            {entry.caption && <p style={{ margin: 0, padding: '4px 8px', fontSize: '11px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.caption}</p>}
                          </div>
                        ))}
                      </div>
                      {galleryModalEntry && (
                        <div
                          role="dialog"
                          aria-modal="true"
                          aria-label="Gallery image full size"
                          onClick={() => setGalleryModalEntry(null)}
                          onKeyDown={(e) => { if (e.key === 'Escape') setGalleryModalEntry(null); }}
                          tabIndex={-1}
                          style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            padding: '20px',
                            boxSizing: 'border-box',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setGalleryModalEntry(null)}
                            aria-label="Close"
                            style={{
                              position: 'absolute',
                              top: '16px',
                              right: '16px',
                              width: '32px',
                              height: '32px',
                              borderRadius: '999px',
                              border: '1px solid rgba(52, 225, 255, 0.35)',
                              background: 'rgba(2, 7, 10, 0.75)',
                              color: 'var(--ink)',
                              fontSize: '18px',
                              cursor: 'pointer',
                              lineHeight: 1,
                              boxShadow: '0 0 10px rgba(52, 225, 255, 0.2)',
                            }}
                          >
                            &times;
                          </button>
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/media/${galleryModalEntry.image_key}`}
                              alt={galleryModalEntry.caption || 'Gallery'}
                              style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 80px)', objectFit: 'contain', display: 'block', borderRadius: '8px' }}
                            />
                            {galleryModalEntry.caption && <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px', textAlign: 'center' }}>{galleryModalEntry.caption}</p>}
                            <button
                              type="button"
                              onClick={() => {
                                handleGalleryDelete(galleryModalEntry.id);
                                setGalleryModalEntry(null);
                              }}
                              disabled={galleryDeletingId === galleryModalEntry.id}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 107, 0, 0.35)',
                                background: 'rgba(255, 107, 0, 0.12)',
                                color: '#ff6b6b',
                                fontSize: '12px',
                                cursor: galleryDeletingId === galleryModalEntry.id ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {galleryDeletingId === galleryModalEntry.id ? 'Deleting…' : 'Delete photo'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="muted" style={{ padding: '12px' }}>No images yet. Upload one above.</div>
                  )}
                </div>
              )}

              {editProfileSubTab === 'guestbook' && (
                <div className="account-edit-panel">
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: 0 }}>
                    <h2 className="section-title" style={{ margin: 0, marginBottom: 0 }}>Notes</h2>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={defaultProfileTab === 'guestbook'} onChange={(e) => handleDefaultTabChange(e.target.checked ? 'guestbook' : 'none')} disabled={defaultTabSaving} style={{ margin: 0 }} />
                      <span>Set as profile default</span>
                    </label>
                  </div>
                  <p className="muted" style={{ fontSize: '13px', marginBottom: '4px', marginTop: '2px' }}>Messages from visitors appear in the Notes tab on your profile. You can delete any message here.</p>
                  {guestbookEntries.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {guestbookEntries.map((entry) => (
                        <div
                          key={entry.id}
                          style={{
                            position: 'relative',
                            padding: '10px 14px 10px 14px',
                            paddingRight: '56px',
                            borderRadius: '10px',
                            border: '1px solid rgba(52, 225, 255, 0.15)',
                            background: 'rgba(2, 7, 10, 0.35)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            alignItems: 'flex-start',
                          }}
                        >
                          <button
                            type="button"
                            className="account-notes-delete-btn"
                            onClick={() => handleGuestbookDelete(entry.id)}
                            disabled={guestbookDeletingId === entry.id}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              flexShrink: 0,
                              width: 'max-content',
                              maxWidth: '56px',
                              minWidth: 'auto',
                              boxSizing: 'border-box',
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255, 107, 0, 0.4)',
                              background: 'rgba(255, 107, 0, 0.1)',
                              color: '#ff6b6b',
                              cursor: guestbookDeletingId === entry.id ? 'not-allowed' : 'pointer',
                              opacity: guestbookDeletingId === entry.id ? 0.6 : 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {guestbookDeletingId === entry.id ? '…' : 'Delete'}
                          </button>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
                            <span style={{ fontWeight: '600', fontSize: '14px' }}>{entry.author_username}</span>
                            <span className="muted" style={{ fontSize: '12px' }} suppressHydrationWarning>{formatDateTime(entry.created_at)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{entry.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted" style={{ padding: '12px' }}>No messages yet. Visitors can leave a message on your profile&apos;s Notes tab.</div>
                  )}
                </div>
              )}

              {editProfileSubTab === 'stats' && (
                <div className="account-edit-panel">
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>Stats</h2>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={defaultProfileTab === 'stats'} onChange={(e) => handleDefaultTabChange(e.target.checked ? 'stats' : 'none')} disabled={defaultTabSaving} style={{ margin: 0 }} />
                      <span>Set as profile default</span>
                    </label>
                  </div>
                  {stats ? (
                    <div className="profile-stats-block profile-stats-block--grid" style={{ marginTop: '4px' }}>
                      <div className="profile-stats-grid">
                        <span className="profile-stat">
                          <span className="profile-stat-label">Portal entry</span>
                          <span className="profile-stat-value date-only-mobile">{formatDate(stats.joinDate)}</span>
                          <span className="profile-stat-value date-with-time-desktop">{formatDateTime(stats.joinDate)}</span>
                        </span>
                        <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.threadCount ?? 0), fontWeight: '600' }}>{stats.threadCount ?? 0}</span><span className="profile-stat-label">threads started</span></span>
                        <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.replyCount ?? 0), fontWeight: '600' }}>{stats.replyCount ?? 0}</span><span className="profile-stat-label">replies contributed</span></span>
                        <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor((stats.threadCount ?? 0) + (stats.replyCount ?? 0)), fontWeight: '600' }}>{(stats.threadCount ?? 0) + (stats.replyCount ?? 0)}</span><span className="profile-stat-label">total contribution (post contributions)</span></span>
                        <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.profileViews ?? 0), fontWeight: '600' }}>{stats.profileViews ?? 0}</span><span className="profile-stat-label">profile visits</span></span>
                        <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.timeSpentMinutes ?? 0), fontWeight: '600' }}>{stats.timeSpentMinutes ?? 0}</span><span className="profile-stat-label">minutes spent on the website</span></span>
                        <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.avatarEditMinutes ?? 0), fontWeight: '600' }}>{stats.avatarEditMinutes ?? 0}</span><span className="profile-stat-label">minutes editing your avatar</span></span>
                      </div>
                    </div>
                  ) : (
                    <div className="muted" style={{ padding: '12px' }}>No stats available.</div>
                  )}
                </div>
              )}

              {editProfileSubTab === 'activity' && (
                <div className="account-edit-panel">
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>Recent activity</h2>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={defaultProfileTab === 'activity'} onChange={(e) => handleDefaultTabChange(e.target.checked ? 'activity' : 'none')} disabled={defaultTabSaving} style={{ margin: 0 }} />
                      <span>Set as profile default</span>
                    </label>
                  </div>
                  {activityItems.length > 0 ? (
                    <div className={`profile-activity-list${activityItems.length >= 5 ? ' profile-activity-list--scrollable' : ''}`} style={{ marginTop: '4px' }}>
                      {activityItems.map(item => (
                        <a key={item.key} href={item.href} className="profile-activity-item">
                          {item.type === 'thread' ? (
                            <>
                              <span className="activity-label">Posted</span>
                              <span className="activity-title" title={item.title}>{item.title}</span>
                              <span className="activity-label">in</span>
                              <span className="activity-section">{item.section}</span>
                              <span className="activity-label">at</span>
                              <span className="activity-meta">{item.timeStr}</span>
                            </>
                          ) : (
                            <>
                              <span className="activity-label">Replied to</span>
                              <span className="activity-title" title={item.title}>{item.title}</span>
                              <span className="activity-label">at</span>
                              <span className="activity-meta">{item.timeStr}</span>
                            </>
                          )}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="muted" style={{ padding: '12px' }}>No recent activity yet.</div>
                  )}
                </div>
              )}

            </div>
            )}
            <div className="tabs-pill neon-outline-card" role="tablist" aria-label="Edit profile sections">
              <div className="tabs-pill-inner">
                <div
                  className="tabs-pill-indicator"
                  style={{
                    width: `${100 / EDIT_PROFILE_SUB_TABS.length}%`,
                    transform: `translateX(${editProfileSubTabIndex >= 0 ? editProfileSubTabIndex * 100 : 0}%)`,
                    opacity: editProfileSubTabIndex >= 0 ? 1 : 0,
                  }}
                  aria-hidden
                />
                {EDIT_PROFILE_SUB_TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={editProfileSubTab === tab.id}
                    onClick={() => setEditProfileSubTab(tab.id)}
                    className={editProfileSubTab === tab.id ? 'account-edit-tab account-edit-tab--active' : 'account-edit-tab'}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
