'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import ClaimUsernameForm from '../../components/ClaimUsernameForm';
import { formatDateTime } from '../../lib/dates';

export default function AccountTabsClient({ activeTab, user, stats: initialStats }) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [usernameStatus, setUsernameStatus] = useState({ type: 'idle', message: null });
  const [selectedColorIndex, setSelectedColorIndex] = useState(user?.preferred_username_color_index ?? null);
  const [colorStatus, setColorStatus] = useState({ type: 'idle', message: null });
  const [socialLinks, setSocialLinks] = useState(() => {
    const links = initialStats?.profileLinks || [];
    // Initialize with empty entries for each platform (only 3 platforms)
    const platforms = ['github', 'youtube', 'soundcloud'];
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
              const platforms = ['github', 'youtube', 'soundcloud'];
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

  const handleSave = async (e) => {
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
    
    // Check if social links changed
    const currentLinks = initialStats?.profileLinks || [];
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

    if (!usernameChanged && !colorChanged && !linksChanged) {
      handleCancel();
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
      if (linksChanged) {
        const fd = new FormData();
        fd.append('links', JSON.stringify(linksToSave));
        const res = await fetch('/api/account/social-links', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) {
          setUsernameStatus({ type: 'error', message: data.error || 'Failed to update social links' });
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

  const handleCancel = () => {
    setNewUsername(user?.username || '');
    setSelectedColorIndex(user?.preferred_username_color_index ?? null);
    setUsernameStatus({ type: 'idle', message: null });
    setColorStatus({ type: 'idle', message: null });
    setIsEditingUsername(false);
    // Reset social links to original values
    const links = initialStats?.profileLinks || [];
    const platforms = ['github', 'youtube', 'soundcloud'];
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
    { value: 'github', label: 'GitHub', icon: '💻' },
    { value: 'youtube', label: 'YouTube', icon: '▶️' },
    { value: 'soundcloud', label: 'SoundCloud', icon: '🎵' },
  ];

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
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Get platform icon component
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'github':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        );
      case 'youtube':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
            <path d="M15.32 4.06c-.434.772-1.05 1.388-1.82 1.82C12.28 6.34 8 6.34 8 6.34s-4.28 0-5.5.54c-.77-.432-1.386-1.048-1.82-1.82C.14 4.84 0 5.4 0 6v4c0 .6.14 1.16.68 1.94.434.772 1.05 1.388 1.82 1.82 1.22.54 5.5.54 5.5.54s4.28 0 5.5-.54c.77-.432 1.386-1.048 1.82-1.82.54-.78.68-1.34.68-1.94V6c0-.6-.14-1.16-.68-1.94zM6.4 9.02V6.98L10.16 8l-3.76 1.02z"/>
          </svg>
        );
      case 'soundcloud':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
            <path d="M19.5 9.5c-.8 0-1.5.7-1.5 1.5v2c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-2c0-.8-.7-1.5-1.5-1.5zm-3-2c-.8 0-1.5.7-1.5 1.5v4c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-4c0-.8-.7-1.5-1.5-1.5zm-3-1c-.8 0-1.5.7-1.5 1.5v5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-5c0-.8-.7-1.5-1.5-1.5zm-3-1c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-6c0-.8-.7-1.5-1.5-1.5zm-3-1c-.8 0-1.5.7-1.5 1.5v7c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-7c0-.8-.7-1.5-1.5-1.5zm-3-1c-.8 0-1.5.7-1.5 1.5v8c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-8c0-.8-.7-1.5-1.5-1.5zm-3-1c-.8 0-1.5.7-1.5 1.5v9c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-9c0-.8-.7-1.5-1.5-1.5zm-3-1c-.8 0-1.5.7-1.5 1.5v10c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-10c0-.8-.7-1.5-1.5-1.5z" fill="#FF6B00" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 107, 0, 0.6))' }}/>
            <path d="M2 12c0-2.2 1.8-4 4-4 .5 0 1 .1 1.4.3C8.2 7.1 9.1 6.5 10 6.5c.9 0 1.8.6 2.6 1.8.4-.2.9-.3 1.4-.3 2.2 0 4 1.8 4 4v1H2v-1z" fill="#FF6B00" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 107, 0, 0.6))' }}/>
          </svg>
        );
      default:
        return '🔗';
    }
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
        </div>
      )}

      {activeTab === 'profile' && user && stats && (
        <div style={{ minWidth: 0, maxWidth: '100%' }}>
          <h2 className="section-title" style={{ borderBottom: 'none' }}>Profile</h2>
          
          {/* Two Column Layout */}
          <div className="account-columns" style={{ marginBottom: '24px' }}>
            {/* Left Column: Stats */}
            <div className="account-col">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            </div>

            {/* Right Column: Username, Color, and Social Links */}
            <div className="account-col">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, maxWidth: '100%' }}>
                {/* Username and Colors Container */}
                <div style={{ position: 'relative', minWidth: 0, maxWidth: '100%' }}>
                  {/* Username Row */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, maxWidth: '100%' }}>
                    {isEditingUsername && (
                      <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '500' }}>
                        username
                      </label>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
                      {!isEditingUsername ? (
                        <Username
                          name={user.username}
                          colorIndex={getUsernameColorIndex(user.username, { preferredColorIndex: user.preferred_username_color_index })}
                        />
                      ) : (
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
                      )}
                    </div>
                  </div>

                  {/* Color Picker Buttons Row */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, maxWidth: '100%', marginTop: '8px' }}>
                    {isEditingUsername && (
                      <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '500' }}>
                        username color
                      </label>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
                    {colorOptions.map((option) => {
                      const isSelected = selectedColorIndex === option.index;
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
                            opacity: disabled ? 0.5 : 1,
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

                  {/* Edit Button - positioned between username and colors on desktop, below everything on mobile */}
                  {!isEditingUsername && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingUsername(true);
                        setNewUsername(user.username);
                        setSelectedColorIndex(user.preferred_username_color_index ?? null);
                        setUsernameStatus({ type: 'idle', message: null });
                        setColorStatus({ type: 'idle', message: null });
                      }}
                      className="username-edit-btn"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(52, 225, 255, 0.3)',
                        background: 'rgba(2, 7, 10, 0.6)',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s ease',
                        fontWeight: '500',
                        zIndex: 1
                      }}
                      title="Edit username and color"
                    >
                      edit
                    </button>
                  )}
                </div>

                {/* Social Links Display - only show when NOT editing */}
                {!isEditingUsername && stats?.profileLinks && stats.profileLinks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
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
                )}

                {/* Edit Button - appears below all content on mobile when columns wrap */}
                {!isEditingUsername && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingUsername(true);
                      setNewUsername(user.username);
                      setSelectedColorIndex(user.preferred_username_color_index ?? null);
                      setUsernameStatus({ type: 'idle', message: null });
                      setColorStatus({ type: 'idle', message: null });
                    }}
                    className="username-edit-btn-mobile"
                    style={{
                      display: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(52, 225, 255, 0.3)',
                      background: 'rgba(2, 7, 10, 0.6)',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s ease',
                      fontWeight: '500',
                      alignSelf: 'flex-start',
                      marginTop: '4px'
                    }}
                    title="Edit username and color"
                  >
                    edit
                  </button>
                )}
              </div>
            </div>

                {/* Social Media Links - only show when editing */}
                {isEditingUsername && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    <strong style={{ fontSize: '14px' }}>Social Links:</strong>
                    {socialLinks.map((link, index) => (
                      <div key={link.platform} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select
                          value={link.platform}
                          onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                          disabled={usernameStatus.type === 'loading'}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(52, 225, 255, 0.3)',
                            background: 'rgba(2, 7, 10, 0.6)',
                            color: 'var(--ink)',
                            fontSize: '13px',
                            width: '100px',
                            flexShrink: 0
                          }}
                        >
                          {socialPlatforms.map(platform => (
                            <option key={platform.value} value={platform.value}>
                              {platform.icon} {platform.label}
                            </option>
                          ))}
                        </select>
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

                {/* Save / Cancel row - only show when editing */}
                {isEditingUsername && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleSave}
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
                      onClick={handleCancel}
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

          {/* Recent Activity */}
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div>
              <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px', borderBottom: 'none' }}>Recent Activity</h4>
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
                        {formatDateTime(item.created_at)}
                      </div>
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
