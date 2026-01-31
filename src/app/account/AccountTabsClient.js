'use client';

import { useRouter } from 'next/navigation';
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
    // Initialize with empty entries for each platform (5 platforms)
    const platforms = ['github', 'youtube', 'soundcloud', 'discord', 'chatgpt'];
    const linkMap = {};
    links.forEach(link => {
      if (typeof link === 'object' && link.platform && link.url) {
        linkMap[link.platform] = link.url;
      }
    });
    return platforms.map(platform => ({
      platform,
      url: linkMap[platform] || ''
    }));
  });
  const [openDropdowns, setOpenDropdowns] = useState({});
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
                  linkMap[link.platform] = link.url;
                }
              });
              setSocialLinks(platforms.map(platform => ({
                platform,
                url: linkMap[platform] || ''
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
      .map(link => ({ platform: link.platform, url: link.url.trim() }));
    
    // Normalize current links to same format
    const normalizedCurrentLinks = Array.isArray(currentLinks) 
      ? currentLinks
          .filter(link => typeof link === 'object' && link.platform && link.url)
          .map(link => ({ platform: link.platform, url: link.url.trim() }))
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
    // Reset social links to original values
    const links = initialStats?.profileLinks || [];
    const platforms = ['github', 'youtube', 'soundcloud', 'discord', 'chatgpt'];
    const linkMap = {};
    links.forEach(link => {
      if (typeof link === 'object' && link.platform && link.url) {
        linkMap[link.platform] = link.url;
      }
    });
    setSocialLinks(platforms.map(platform => ({
      platform,
      url: linkMap[platform] || ''
    })));
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

  return (
    <section className="card account-profile-card">
      <div
        className="account-profile-tabs"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '12px',
          marginBottom: '16px',
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
          {/* Two Column Layout */}
          <div className="account-columns" style={{ marginBottom: '24px' }}>
            {/* Left Column: Profile Card */}
            <div className="account-col">
              <div style={{ 
                padding: '16px', 
                background: 'rgba(2, 7, 10, 0.4)', 
                borderRadius: '12px', 
                border: '1px solid rgba(52, 225, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minWidth: 0
              }}>
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
                    onClick={() => { setIsEditingAvatar(true); setIsEditingUsername(false); setIsEditingSocials(false); }}
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
                        {socialLinks.map((link, index) => (
                          <div key={link.platform} style={{ display: 'flex', gap: '6px', alignItems: 'center', position: 'relative' }}>
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingSocials(true);
                      setIsEditingUsername(false);
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

                {/* Save / Cancel row */}
                {(isEditingUsername || isEditingSocials) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={isEditingUsername ? handleSaveUsername : handleSaveSocials}
                      disabled={usernameStatus.type === 'loading'}
                      style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        flex: '1 1 auto',
                        background: 'var(--accent)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'var(--bg)',
                        cursor: usernameStatus.type === 'loading' ? 'not-allowed' : 'pointer',
                        opacity: usernameStatus.type === 'loading' ? 0.6 : 1,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {usernameStatus.type === 'loading' ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={isEditingUsername ? handleCancelUsername : handleCancelSocials}
                      disabled={usernameStatus.type === 'loading'}
                      style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        flex: '1 1 auto',
                        background: 'transparent',
                        border: '1px solid rgba(52, 225, 255, 0.3)',
                        borderRadius: '6px',
                        color: 'var(--muted)',
                        cursor: usernameStatus.type === 'loading' ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {usernameStatus.message && (
                  <div style={{
                    fontSize: '12px',
                    color: usernameStatus.type === 'error' ? '#ff6b6b' : usernameStatus.type === 'success' ? '#00f5a0' : 'var(--muted)'
                  }}>
                    {usernameStatus.message}
                  </div>
                )}

              </div>
            </div>
            </div>

            {/* Right Column: Stats Card */}
            <div className="account-col">
              <div style={{ 
                padding: '16px', 
                background: 'rgba(2, 7, 10, 0.4)', 
                borderRadius: '12px', 
                border: '1px solid rgba(52, 225, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                textAlign: 'right'
              }}>
                <h2 className="section-title" style={{ margin: 0, textAlign: 'right' }}>Stats</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'right' }}>
                  {(() => {
                    // RPG-style rarity color function
                    const getRarityColor = (value) => {
                      if (value === 0) return 'var(--muted)';
                      if (value < 10) return 'var(--accent)'; // Common - cyan
                      if (value < 100) return '#00f5a0'; // Uncommon - green
                      if (value < 1000) return '#5b8def'; // Rare - blue
                      return '#b794f6'; // Epic - purple
                    };

                    return (
                      <>
                        <div>
                          <span style={{ color: 'var(--muted)' }}>Portal entry date:</span>{' '}
                          <span style={{ color: 'var(--accent)' }}>
                            <span className="date-only-mobile">{formatDate(stats.joinDate)}</span>
                            <span className="date-with-time-desktop">{formatDateTime(stats.joinDate)}</span>
                          </span>
                        </div>
                        <div>
                          <span style={{ color: getRarityColor(stats.threadCount), fontWeight: '600' }}>{stats.threadCount}</span>
                          <span style={{ color: 'var(--muted)', marginLeft: '6px' }}>{stats.threadCount === 1 ? 'thread started' : 'threads started'}</span>
                        </div>
                        <div>
                          <span style={{ color: getRarityColor(stats.replyCount), fontWeight: '600' }}>{stats.replyCount}</span>
                          <span style={{ color: 'var(--muted)', marginLeft: '6px' }}>{stats.replyCount === 1 ? 'reply contributed' : 'replies contributed'}</span>
                        </div>
                        <div>
                          <span style={{ color: getRarityColor(stats.threadCount + stats.replyCount), fontWeight: '600' }}>{stats.threadCount + stats.replyCount}</span>
                          <span style={{ color: 'var(--muted)', marginLeft: '6px' }}>total contributions</span>
                        </div>
                        <div>
                          <span style={{ color: getRarityColor(stats.profileViews || 0), fontWeight: '600' }}>{stats.profileViews || 0}</span>
                          <span style={{ color: 'var(--muted)', marginLeft: '6px' }}>{(stats.profileViews || 0) === 1 ? 'profile visit' : 'profile visits'}</span>
                        </div>
                        <div>
                          <span style={{ color: getRarityColor(stats.timeSpentMinutes || 0), fontWeight: '600' }}>{stats.timeSpentMinutes || 0}</span>
                          <span style={{ color: 'var(--muted)', marginLeft: '6px' }}>{(stats.timeSpentMinutes || 0) === 1 ? 'minute on site' : 'minutes on site'}</span>
                        </div>
                        <div>
                          <span style={{ color: getRarityColor(stats.avatarEditMinutes || 0), fontWeight: '600' }}>{stats.avatarEditMinutes || 0}</span>
                          <span style={{ color: 'var(--muted)', marginLeft: '6px' }}>{(stats.avatarEditMinutes || 0) === 1 ? 'minute editing avatar' : 'minutes editing avatar'}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div>
              <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px', borderBottom: 'none' }}>Recent Activity</h4>
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
                    <a
                      key={`${item.type}-${item.id}`}
                      href={href}
                      className="profile-activity-item"
                    >
                      {item.type === 'thread' ? (
                        <>
                          <span className="activity-label">Posted</span>
                          <span className="activity-title" title={title}>{title}</span>
                          <span className="activity-label">in</span>
                          <span className="activity-section">{section}</span>
                          <span className="activity-label">at</span>
                          <span className="activity-meta" suppressHydrationWarning>{timeStr}</span>
                        </>
                      ) : (
                        <>
                          <span className="activity-label">Replied to</span>
                          <span className="activity-title" title={title}>{title}</span>
                          <span className="activity-label">at</span>
                          <span className="activity-meta" suppressHydrationWarning>{timeStr}</span>
                        </>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px', borderBottom: 'none' }}>Recent Activity</h4>
              <div className="muted" style={{ padding: '12px' }}>No recent activity yet.</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
