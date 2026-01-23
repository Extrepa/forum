'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import ClaimUsernameForm from '../../components/ClaimUsernameForm';

function formatDateTime(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AccountTabsClient({ activeTab, user, stats: initialStats }) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [usernameStatus, setUsernameStatus] = useState({ type: 'idle', message: null });
  const [selectedColorIndex, setSelectedColorIndex] = useState(user?.preferred_username_color_index ?? null);
  const [colorStatus, setColorStatus] = useState({ type: 'idle', message: null });

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

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    setUsernameStatus({ type: 'loading', message: 'Updating username...' });

    const formData = new FormData();
    formData.append('username', newUsername);

    try {
      const res = await fetch('/api/account/username', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUsernameStatus({ type: 'success', message: 'Username updated successfully!' });
        setIsEditingUsername(false);
        // Refresh the page to get updated user data
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setUsernameStatus({ type: 'error', message: data.error || 'Failed to update username' });
      }
    } catch (e) {
      setUsernameStatus({ type: 'error', message: 'Network error. Please try again.' });
    }
  };

  const handleColorUpdate = async (colorIndex) => {
    setSelectedColorIndex(colorIndex);
    setColorStatus({ type: 'loading', message: 'Updating color...' });

    const formData = new FormData();
    formData.append('color_index', colorIndex === null ? '' : String(colorIndex));

    try {
      const res = await fetch('/api/account/username-color', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setColorStatus({ type: 'success', message: 'Color preference updated!' });
        setTimeout(() => {
          setColorStatus({ type: 'idle', message: null });
          router.refresh();
        }, 1000);
      } else {
        setColorStatus({ type: 'error', message: data.error || 'Failed to update color' });
        // Revert selection
        setSelectedColorIndex(user?.preferred_username_color_index ?? null);
      }
    } catch (e) {
      setColorStatus({ type: 'error', message: 'Network error. Please try again.' });
      setSelectedColorIndex(user?.preferred_username_color_index ?? null);
    }
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

  return (
    <section className="card">
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => handleTabChange('account')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'account' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'account' ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'account' ? '600' : '400'
          }}
        >
          Account
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'profile' ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer',
            fontSize: '16px',
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
        <div>
          <h2 className="section-title" style={{ borderBottom: 'none' }}>Profile</h2>
          
          {/* Username and Color Section - Same Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Left side: Username */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: '1 1 auto', minWidth: 0 }}>
                <strong>Username:</strong>
                {!isEditingUsername ? (
                  <>
                    <Username 
                      name={user.username} 
                      colorIndex={getUsernameColorIndex(user.username, { preferredColorIndex: user.preferred_username_color_index })} 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingUsername(true);
                        setNewUsername(user.username);
                        setUsernameStatus({ type: 'idle', message: null });
                      }}
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        height: '20px',
                        background: 'rgba(52, 225, 255, 0.1)',
                        border: '1px solid rgba(52, 225, 255, 0.3)',
                        borderRadius: '4px',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleUsernameUpdate} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                        minWidth: '120px'
                      }}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={usernameStatus.type === 'loading'}
                      style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        background: 'var(--accent)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'var(--bg)',
                        cursor: usernameStatus.type === 'loading' ? 'not-allowed' : 'pointer',
                        opacity: usernameStatus.type === 'loading' ? 0.6 : 1
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername(user.username);
                        setUsernameStatus({ type: 'idle', message: null });
                      }}
                      style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        background: 'transparent',
                        border: '1px solid rgba(52, 225, 255, 0.3)',
                        borderRadius: '6px',
                        color: 'var(--muted)',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>

              {/* Right side: Color picker icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
                <strong>Username color:</strong>
                {colorOptions.map((option) => (
                  <button
                    key={option.index ?? 'auto'}
                    type="button"
                    onClick={() => handleColorUpdate(option.index)}
                    disabled={colorStatus.type === 'loading'}
                    style={{
                      width: option.index === null ? 'auto' : '20px',
                      height: '20px',
                      minWidth: option.index === null ? '36px' : '20px',
                      borderRadius: '3px',
                      border: selectedColorIndex === option.index ? '2px solid var(--accent)' : '1px solid rgba(52, 225, 255, 0.3)',
                      background: option.index === null 
                        ? 'repeating-linear-gradient(45deg, rgba(52, 225, 255, 0.3), rgba(52, 225, 255, 0.3) 4px, transparent 4px, transparent 8px)'
                        : option.color,
                      cursor: colorStatus.type === 'loading' ? 'not-allowed' : 'pointer',
                      opacity: colorStatus.type === 'loading' ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      padding: option.index === null ? '0 5px' : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: option.index === null ? '10px' : '0',
                      color: 'var(--ink)',
                      fontWeight: 'bold'
                    }}
                    title={option.name}
                  >
                    {option.index === null ? 'Auto' : ''}
                  </button>
                ))}
              </div>
            </div>
            {usernameStatus.message && (
              <div style={{
                fontSize: '12px',
                color: usernameStatus.type === 'error' ? '#ff6b6b' : usernameStatus.type === 'success' ? '#00f5a0' : 'var(--muted)'
              }}>
                {usernameStatus.message}
              </div>
            )}
            {colorStatus.message && (
              <div style={{
                fontSize: '12px',
                color: colorStatus.type === 'error' ? '#ff6b6b' : colorStatus.type === 'success' ? '#00f5a0' : 'var(--muted)'
              }}>
                {colorStatus.message}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
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
