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

  // Refresh stats when tab becomes active or on focus
  useEffect(() => {
    if (activeTab === 'profile' && user) {
      const refreshStats = async () => {
        try {
          const res = await fetch('/api/account/stats');
          if (res.ok) {
            const data = await res.json();
            setStats(data);
            // Update social links if they changed
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
            // Do not overwrite profile extras here - they are synced from initialStats and after save (to avoid overwriting in-progress edit when poll runs)
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
    try {
      const res = await fetch('/api/account/profile-extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_mood_text: profileMoodText.trim(),
          profile_mood_emoji: profileMoodEmoji.trim(),
          profile_headline: profileHeadline.trim(),
          profile_song_url: profileSongUrl.trim(),
          profile_song_provider: profileSongProvider.trim() || null,
          profile_song_autoplay_enabled: profileSongAutoplay,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setExtrasStatus({ type: 'error', message: data.error || 'Save failed' });
        return;
      }
      setExtrasStatus({ type: 'success', message: 'Saved.' });
      setIsEditingExtras(false);
      const refreshRes = await fetch('/api/account/stats');
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        setStats(refreshed);
        setProfileMoodText(refreshed.profileMoodText ?? '');
        setProfileMoodEmoji(refreshed.profileMoodEmoji ?? '');
        setProfileHeadline(refreshed.profileHeadline ?? '');
        setProfileSongUrl(refreshed.profileSongUrl ?? '');
        setProfileSongProvider(refreshed.profileSongProvider ?? '');
        setProfileSongAutoplay(Boolean(refreshed.profileSongAutoplayEnabled));
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
    };
    return map[t] || 'Forum';
  };

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
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '15px',
    whiteSpace: 'nowrap',
    width: '100%',
    textAlign: 'center',
    boxSizing: 'border-box'
  };

  const EDIT_PROFILE_SUB_TABS = [
    { id: 'profile', label: 'Profile' },
    { id: 'mood', label: 'Mood & Song' },
    { id: 'socials', label: 'Socials' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'guestbook', label: 'Guestbook' },
    { id: 'stats', label: 'Stats' },
    { id: 'activity', label: 'Activity' },
  ];
  const [editProfileSubTab, setEditProfileSubTab] = useState(null);
  const editProfileSubTabIndex = EDIT_PROFILE_SUB_TABS.findIndex(t => t.id === editProfileSubTab);
  const roleLabel = user?.role === 'admin' ? 'Drip Warden' : user?.role === 'mod' ? 'Drip Guardian' : 'Drip';
  const roleColor = user?.role === 'admin' ? 'var(--role-admin)' : user?.role === 'mod' ? 'var(--role-mod)' : 'var(--role-user)';
  const [defaultProfileTab, setDefaultProfileTab] = useState(stats?.defaultProfileTab ?? null);
  const [defaultTabSaving, setDefaultTabSaving] = useState(false);
  useEffect(() => {
    if (stats?.defaultProfileTab !== undefined) setDefaultProfileTab(stats.defaultProfileTab ?? null);
  }, [stats?.defaultProfileTab]);
  const handleDefaultTabChange = async (value) => {
    const v = value === 'none' || value === '' ? null : value;
    setDefaultProfileTab(v);
    setDefaultTabSaving(true);
    try {
      const res = await fetch('/api/account/default-profile-tab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_profile_tab: v }),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(prev => prev ? { ...prev, defaultProfileTab: data.default_profile_tab } : prev);
      }
    } finally {
      setDefaultTabSaving(false);
    }
  };
  const DEFAULT_TAB_OPTIONS = [
    { value: 'none', label: 'None (profile card only)' },
    { value: 'stats', label: 'Stats' },
    { value: 'activity', label: 'Activity' },
    { value: 'socials', label: 'Socials' },
    { value: 'gallery', label: 'Gallery' },
    { value: 'guestbook', label: 'Guestbook' },
  ];

  return (
    <section className="card account-card">
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
            borderBottomColor: activeTab === 'account' ? 'var(--accent)' : 'transparent',
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
            borderBottomColor: activeTab === 'profile' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'profile' ? 'var(--accent)' : 'var(--muted)',
            fontWeight: activeTab === 'profile' ? '600' : '400'
          }}
        >
          Edit profile
        </button>
      </div>

      {activeTab === 'profile' && user?.username && (
        <p className="account-profile-hint muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
          Edit how your profile appears to others ·{' '}
          <Link href={`/profile/${encodeURIComponent(user.username)}`} className="account-view-profile-link" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>
            View public profile
          </Link>
        </p>
      )}

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
          <div className="account-edit-card account-edit-card--tabs-bottom">
            {/* Profile preview card – read-only, always visible */}
            <div className="account-profile-preview">
              <div className="profile-card-header" style={{ padding: '0', border: 'none', background: 'transparent' }}>
                <div className="profile-card-header-avatar">
                  {user.avatar_key ? (
                    <AvatarImage src={getAvatarUrl(user.avatar_key)} alt="" size={96} loading="eager" style={{ width: '96px', height: '96px', borderRadius: '50%', display: 'block', background: 'rgba(0,0,0,0.5)' }} />
                  ) : (
                    <div style={{ width: '96px', height: '96px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '12px' }}>No avatar</div>
                  )}
                </div>
                <div className="profile-card-header-meta">
                  <Username name={user.username} colorIndex={getUsernameColorIndex(user.username, { preferredColorIndex: user.preferred_username_color_index })} avatarKey={undefined} href={null} style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: '700' }} />
                  <div style={{ color: roleColor, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{roleLabel}</div>
                  <div className="profile-card-mood-song" style={{ marginTop: '6px' }}>
                    {(stats.profileMoodText || stats.profileMoodEmoji) && <div className="profile-mood-chip"><span>{stats.profileMoodEmoji}{stats.profileMoodEmoji ? ' ' : ''}{stats.profileMoodText}</span></div>}
                    {(stats.profileSongUrl || stats.profileSongProvider) && <div className="profile-song-compact"><span className="profile-song-provider">{stats.profileSongProvider ? stats.profileSongProvider.charAt(0).toUpperCase() + stats.profileSongProvider.slice(1) : ''}</span> <a href={stats.profileSongUrl} target="_blank" rel="noopener noreferrer" className="profile-song-link">{stats.profileSongUrl}</a></div>}
                    {!stats.profileMoodText && !stats.profileMoodEmoji && !stats.profileSongUrl && <span className="muted" style={{ fontSize: '13px' }}>No mood or song set yet.</span>}
                  </div>
                  {stats.profileHeadline && <div style={{ marginTop: '6px', fontSize: '14px' }}>{stats.profileHeadline}</div>}
                  {(() => {
                    const allLinks = (stats.profileLinks || []).filter(l => typeof l === 'object' && l.platform && l.url);
                    const featuredLinks = allLinks.filter(l => l.featured);
                    const linksToShow = featuredLinks.length > 0 ? featuredLinks.slice(0, FEATURED_SOCIALS_MAX) : allLinks.slice(0, FEATURED_SOCIALS_MAX);
                    if (linksToShow.length === 0) return null;
                    return (
                      <div className="profile-socials-inline" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {linksToShow.map((link) => {
                          const un = extractUsername(link.platform, link.url);
                          const isSoundCloud = link.platform === 'soundcloud';
                          return (
                            <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px', border: isSoundCloud ? '1px solid rgba(255, 107, 0, 0.3)' : '1px solid rgba(52, 225, 255, 0.3)', background: isSoundCloud ? 'rgba(255, 107, 0, 0.05)' : 'rgba(52, 225, 255, 0.05)', color: 'var(--accent)', textDecoration: 'none', fontSize: '12px' }}>
                              {getPlatformIcon(link.platform)}{un && <span style={{ color: 'var(--ink)' }}>{un}</span>}
                            </a>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="account-preview-stats" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexWrap: 'wrap', gap: '12px 20px', fontSize: '13px', color: 'var(--muted)' }}>
                <span><span style={{ color: 'var(--accent)' }}>{formatDate(stats.joinDate)}</span> joined</span>
                <span><strong style={{ color: 'var(--ink)' }}>{stats.threadCount}</strong> threads</span>
                <span><strong style={{ color: 'var(--ink)' }}>{stats.replyCount}</strong> replies</span>
                <span><strong style={{ color: 'var(--ink)' }}>{stats.profileViews || 0}</strong> visits</span>
              </div>
              {stats.recentActivity && stats.recentActivity.length > 0 && (
                <div className="account-preview-activity" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 className="section-title" style={{ fontSize: '14px', marginBottom: '8px' }}>Recent activity</h4>
                  <div className="profile-activity-list" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {stats.recentActivity.slice(0, 5).map((item) => {
                      let href = '#';
                      if (item.type === 'thread') { const pt = item.postType || item.post_type; if (pt === 'forum_thread') href = `/lobby/${item.id}`; else if (pt === 'dev_log') href = `/devlog/${item.id}`; else if (pt === 'music_post') href = `/music/${item.id}`; else if (pt === 'project') href = `/projects/${item.id}`; else if (pt === 'timeline_update') href = `/announcements/${item.id}`; else if (pt === 'event') href = `/events/${item.id}`; }
                      else { const rt = item.replyType || item.reply_type; const tid = item.thread_id; if (rt === 'forum_reply') href = `/lobby/${tid}`; else if (rt === 'dev_log_comment') href = `/devlog/${tid}`; else if (rt === 'music_comment') href = `/music/${tid}`; else if (rt === 'project_reply') href = `/projects/${tid}`; else if (rt === 'timeline_comment') href = `/announcements/${tid}`; else if (rt === 'event_comment') href = `/events/${tid}`; }
                      const section = getSectionLabel(item.postType || item.post_type, item.replyType || item.reply_type);
                      const title = item.type === 'thread' ? item.title : item.thread_title;
                      return (
                        <a key={`${item.type}-${item.id}`} href={href} className="profile-activity-item" style={{ padding: '6px 0', fontSize: '12px' }}>
                          {item.type === 'thread' ? <>Posted <span className="activity-title">{title}</span> in {section}</> : <>Replied to <span className="activity-title">{title}</span></>}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="account-display-settings" style={{ marginBottom: '16px', padding: '12px 14px', background: 'rgba(2, 7, 10, 0.3)', borderRadius: '10px', border: '1px solid rgba(52, 225, 255, 0.15)' }}>
              <h4 className="section-title" style={{ fontSize: '13px', margin: '0 0 8px 0', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile display</h4>
              <label style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink)' }}>
                <span>Default section on your profile:</span>
                <select
                  value={defaultProfileTab || 'none'}
                  onChange={(e) => handleDefaultTabChange(e.target.value)}
                  disabled={defaultTabSaving}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(52, 225, 255, 0.3)',
                    background: 'rgba(2, 7, 10, 0.6)',
                    color: 'var(--ink)',
                    fontSize: '13px',
                    minWidth: '140px',
                  }}
                >
                  {DEFAULT_TAB_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {defaultTabSaving && <span className="muted" style={{ fontSize: '12px' }}>Saving…</span>}
              </label>
            </div>

            {editProfileSubTab !== null && (
            <div className="account-edit-tab-content account-edit-tab-content--above">
              {editProfileSubTab === 'profile' && (
                <div className="account-edit-panel">
                <h2 className="section-title" style={{ margin: 0 }}>Profile</h2>
                {/* Custom Avatar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minHeight: '96px', flexWrap: 'wrap' }}>
                      {user.avatar_key ? (
                        <div style={{ position: 'relative' }}>
                          <AvatarImage
                            src={getAvatarUrl(user.avatar_key)}
                            alt="Current Avatar"
                            size={96}
                            loading="eager"
                            style={{
                              width: '96px',
                              height: '96px',
                              display: 'block',
                              borderRadius: '50%',
                              background: 'rgba(0,0,0,0.5)'
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ width: '96px', height: '96px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '10px', textAlign: 'center', padding: '10px' }}>
                          No avatar set
                        </div>
                      )}
                    </div>
                    {!isEditingAvatar && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mini preview</span>
                        <AvatarImage
                          src={getAvatarUrl(user.avatar_key)}
                          alt="Mini avatar preview"
                          size={24}
                          loading="lazy"
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.5)'
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsEditingAvatar(true); setIsEditingUsername(false); setIsEditingSocials(false); setIsEditingExtras(false); }}
                    disabled={isEditingAvatar}
                    title="Modify your neural representation"
                    style={{
                      borderRadius: '999px',
                      border: 'none',
                      background: 'linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9))',
                      color: '#001018',
                      cursor: isEditingAvatar ? 'default' : 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s ease',
                      fontWeight: '600',
                      padding: '2px 10px',
                      lineHeight: '1.2',
                      opacity: isEditingAvatar ? 0.6 : 1,
                      justifySelf: 'end',
                      boxShadow: '0 0 12px rgba(52, 225, 255, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isEditingAvatar) {
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 0 18px rgba(255, 52, 245, 0.45)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isEditingAvatar) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(52, 225, 255, 0.3)';
                      }
                    }}
                  >
                    Edit Avatar
                  </button>
                </div>
                {isEditingAvatar && (
                  <AvatarCustomizer 
                    onSave={handleAvatarSave} 
                    onCancel={() => setIsEditingAvatar(false)}
                    initialState={avatarInitialState}
                    key={user?.avatar_state || 'avatar-empty'}
                  />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, maxWidth: '100%' }}>
                {/* Username and Colors Container */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    {/* Username Row */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, maxWidth: '100%' }}>
                      {isEditingUsername && (
                        <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold' }}>
                          Username
                        </label>
                      )}
                      {!isEditingUsername ? (
                        <div>
                          <strong>Username:</strong>{' '}
                            <Username
                            name={user.username}
                            colorIndex={getUsernameColorIndex(user.username, { preferredColorIndex: user.preferred_username_color_index })}
                            avatarKey={undefined}
                            href={null}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
                          <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="username"
                            pattern="[a-z0-9_]{3,20}"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid rgba(52, 225, 255, 0.3)',
                              background: 'rgba(2, 7, 10, 0.6)',
                              color: 'var(--ink)',
                              fontSize: '14px',
                              minWidth: '120px',
                              maxWidth: '100%',
                              flex: '1 1 auto'
                            }}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    {/* Color Picker Buttons Row */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, maxWidth: '100%', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
                        <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold' }}>Color:</span>
                        {(isEditingUsername ? colorOptions : colorOptions.filter((option) => option.index === (user.preferred_username_color_index ?? null))).map((option) => {
                          const displayIndex = isEditingUsername ? selectedColorIndex : (user.preferred_username_color_index ?? null);
                          const isSelected = displayIndex === option.index;
                          const disabled = !isEditingUsername || usernameStatus.type === 'loading';
                          const size = 18;
                          return (
                            <button
                              key={option.index ?? 'auto'}
                              type="button"
                              onClick={() => isEditingUsername && !disabled && setSelectedColorIndex(option.index)}
                              disabled={disabled}
                              className={isEditingUsername && !disabled ? 'color-picker-btn' : ''}
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
                                cursor: disabled ? 'default' : 'pointer',
                                opacity: isEditingUsername ? (disabled ? 0.5 : 1) : 1,
                                transition: 'all 0.2s ease',
                                padding: 0,
                                margin: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                                boxShadow: isSelected && isEditingUsername ? '0 0 12px rgba(52, 225, 255, 0.6)' : 'none',
                                lineHeight: 1,
                                verticalAlign: 'middle'
                              }}
                              title={option.name}
                              onMouseEnter={(e) => {
                                if (isEditingUsername && !disabled) {
                                  e.currentTarget.style.boxShadow = '0 0 16px rgba(52, 225, 255, 0.8)';
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (isEditingUsername && !disabled) {
                                  e.currentTarget.style.boxShadow = isSelected ? '0 0 12px rgba(52, 225, 255, 0.6)' : 'none';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }
                              }}
                            >
                              {option.index === null && (
                                <span style={{ fontSize: '8px', color: 'var(--ink)', fontWeight: 'bold', lineHeight: 1, display: 'block' }}>A</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingUsername(true);
                      setIsEditingSocials(false);
                      setIsEditingExtras(false);
                      setNewUsername(user.username);
                      setSelectedColorIndex(user.preferred_username_color_index ?? null);
                      setUsernameStatus({ type: 'idle', message: null });
                      setColorStatus({ type: 'idle', message: null });
                    }}
                    disabled={isEditingUsername}
                    title="Change your network identifier"
                    style={{
                      borderRadius: '999px',
                      border: 'none',
                      background: 'linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9))',
                      color: '#001018',
                      cursor: isEditingUsername ? 'default' : 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s ease',
                      fontWeight: '600',
                      padding: '2px 10px',
                      lineHeight: '1.2',
                      opacity: isEditingUsername ? 0.6 : 1,
                      justifySelf: 'end',
                      boxShadow: '0 0 12px rgba(52, 225, 255, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isEditingUsername) {
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 0 18px rgba(255, 52, 245, 0.45)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isEditingUsername) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(52, 225, 255, 0.3)';
                      }
                    }}
                  >
                    Edit Username
                  </button>
                </div>

                {isEditingUsername && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%', marginTop: '8px' }}>
                    <button type="button" onClick={handleSaveUsername} disabled={usernameStatus.type === 'loading'} style={{ fontSize: '12px', padding: '6px 12px', flex: '1 1 auto', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: 'var(--bg)', cursor: usernameStatus.type === 'loading' ? 'not-allowed' : 'pointer', opacity: usernameStatus.type === 'loading' ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                      {usernameStatus.type === 'loading' ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" onClick={handleCancelUsername} disabled={usernameStatus.type === 'loading'} style={{ fontSize: '12px', padding: '6px 12px', flex: '1 1 auto', background: 'transparent', border: '1px solid rgba(52, 225, 255, 0.3)', borderRadius: '6px', color: 'var(--muted)', cursor: usernameStatus.type === 'loading' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>Cancel</button>
                  </div>
                )}
                {usernameStatus.message && editProfileSubTab === 'profile' && (
                  <div style={{ fontSize: '12px', color: (usernameStatus.type === 'error') ? '#ff6b6b' : (usernameStatus.type === 'success') ? '#00f5a0' : 'var(--muted)' }}>{usernameStatus.message}</div>
                )}
                </div>
                </div>
              )}

              {editProfileSubTab === 'mood' && (
                <div className="account-edit-panel">
                <h2 className="section-title" style={{ margin: 0 }}>Mood & Song</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
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
                    <div><label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Mood text</label><input type="text" value={profileMoodText} onChange={(e) => setProfileMoodText(e.target.value)} placeholder="e.g. Chillin" maxLength={200} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--ink)', fontSize: '13px' }} /></div>
                    <div><label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Mood emoji (optional)</label><input type="text" value={profileMoodEmoji} onChange={(e) => setProfileMoodEmoji(e.target.value)} placeholder="e.g. " maxLength={20} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--ink)', fontSize: '13px' }} /></div>
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
                <h2 className="section-title" style={{ margin: 0 }}>Socials</h2>
                <p className="muted" style={{ fontSize: '12px', marginBottom: '8px' }}>These links appear on your profile in the Socials tab (Lately).</p>
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
                  <h2 className="section-title" style={{ margin: 0 }}>Gallery</h2>
                  <p className="muted" style={{ fontSize: '13px' }}>Upload images to show in the Gallery tab on your profile. Coming soon.</p>
                </div>
              )}

              {editProfileSubTab === 'guestbook' && (
                <div className="account-edit-panel">
                  <h2 className="section-title" style={{ margin: 0 }}>Guestbook</h2>
                  <p className="muted" style={{ fontSize: '13px' }}>Messages from visitors appear in the Guestbook tab on your profile. Coming soon.</p>
                </div>
              )}

              {editProfileSubTab === 'stats' && (
                <div className="account-edit-panel">
                  <h2 className="section-title" style={{ margin: 0 }}>Stats</h2>
                  <div className="profile-stats-block profile-stats-block--grid">
                    <div className="profile-stats-grid">
                      {(() => {
                        const getRarityColor = (value) => {
                          if (value === 0) return 'var(--muted)';
                          if (value < 10) return 'var(--accent)';
                          if (value < 100) return '#00f5a0';
                          if (value < 1000) return '#5b8def';
                          return '#b794f6';
                        };
                        return (
                          <>
                            <span className="profile-stat"><span className="profile-stat-label">Portal entry</span> <span className="profile-stat-value"><span className="date-only-mobile">{formatDate(stats.joinDate)}</span><span className="date-with-time-desktop">{formatDateTime(stats.joinDate)}</span></span></span>
                            <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.threadCount), fontWeight: '600' }}>{stats.threadCount}</span> <span className="profile-stat-label">threads</span></span>
                            <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.replyCount), fontWeight: '600' }}>{stats.replyCount}</span> <span className="profile-stat-label">replies</span></span>
                            <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.profileViews || 0), fontWeight: '600' }}>{stats.profileViews || 0}</span> <span className="profile-stat-label">visits</span></span>
                            <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.timeSpentMinutes || 0), fontWeight: '600' }}>{stats.timeSpentMinutes || 0}</span> <span className="profile-stat-label">min on site</span></span>
                            <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.avatarEditMinutes || 0), fontWeight: '600' }}>{stats.avatarEditMinutes || 0}</span> <span className="profile-stat-label">avatar min</span></span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {editProfileSubTab === 'activity' && (
                <div className="account-edit-panel">
                  <h2 className="section-title" style={{ margin: 0 }}>Recent Activity</h2>
                  {stats.recentActivity && stats.recentActivity.length > 0 ? (
                    <div className={`profile-activity-list${stats.recentActivity.length > 5 ? ' profile-activity-list--scrollable' : ''}`}>
                      {stats.recentActivity.map((item) => {
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
                        const postType = item.postType || item.post_type;
                        const replyType = item.replyType || item.reply_type;
                        const section = getSectionLabel(postType, replyType);
                        const title = item.type === 'thread' ? item.title : item.thread_title;
                        const timeStr = formatDateTime(item.created_at);
                        return (
                          <a key={`${item.type}-${item.id}`} href={href} className="profile-activity-item">
                            {item.type === 'thread' ? (
                              <><span className="activity-label">Posted</span><span className="activity-title" title={title}>{title}</span><span className="activity-label">in</span><span className="activity-section">{section}</span><span className="activity-label">at</span><span className="activity-meta" suppressHydrationWarning>{timeStr}</span></>
                            ) : (
                              <><span className="activity-label">Replied to</span><span className="activity-title" title={title}>{title}</span><span className="activity-label">at</span><span className="activity-meta" suppressHydrationWarning>{timeStr}</span></>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="muted" style={{ padding: '12px' }}>No recent activity yet.</div>
                  )}
                </div>
              )}

            </div>
            )}
            <div className="tabs-pill" role="tablist" aria-label="Edit profile sections">
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
