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
                {/* Username row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
                  <strong>Username:</strong>
                  {!isEditingUsername ? (
                    <div style={{ flexShrink: 0 }}>
                      <Username
                        name={user.username}
                        colorIndex={getUsernameColorIndex(user.username, { preferredColorIndex: user.preferred_username_color_index })}
                      />
                    </div>
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

                {/* Username color label and picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
                  <strong>Username color:</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', flex: '0 0 auto' }}>
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
                        style={{
                          flex: '0 0 auto',
                          width: option.index === null ? 'auto' : size,
                          height: size,
                          minWidth: option.index === null ? 'auto' : size,
                          aspectRatio: option.index === null ? 'auto' : '1',
                          borderRadius: option.index === null ? '3px' : '50%',
                          border: isSelected ? '2px solid var(--accent)' : '1px solid rgba(52, 225, 255, 0.3)',
                          background: option.index === null
                            ? 'repeating-linear-gradient(45deg, rgba(52, 225, 255, 0.3), rgba(52, 225, 255, 0.3) 4px, transparent 4px, transparent 8px)'
                            : option.color,
                          cursor: disabled ? 'default' : 'pointer',
                          opacity: disabled ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          padding: option.index === null ? '0 6px' : 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: option.index === null ? '9px' : '0',
                          color: 'var(--ink)',
                          fontWeight: 'bold',
                          boxSizing: 'border-box'
                        }}
                        title={option.name}
                      >
                        {option.index === null ? 'Auto' : ''}
                      </button>
                    );
                  })}
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

                {/* Edit / Save / Cancel row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%', marginTop: '8px' }}>
                  {!isEditingUsername ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingUsername(true);
                        setNewUsername(user.username);
                        setSelectedColorIndex(user.preferred_username_color_index ?? null);
                        setUsernameStatus({ type: 'idle', message: null });
                        setColorStatus({ type: 'idle', message: null });
                      }}
                      style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        height: '32px',
                        width: '100%',
                        background: 'rgba(52, 225, 255, 0.1)',
                        border: '1px solid rgba(52, 225, 255, 0.3)',
                        borderRadius: '6px',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Edit
                    </button>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

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
