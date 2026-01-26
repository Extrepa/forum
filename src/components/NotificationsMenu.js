'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUsernameColorIndex } from '../lib/usernameColor';
import DeleteConfirmModal from './DeleteConfirmModal';

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = Math.max(0, now - Number(timestamp || 0));
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  return 'just now';
}

function TrashIcon({ size = 10 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Delete"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

const ERL_TAGLINES = [
  'The goo is listening.',
  'Portal status: active.',
  'Drip on.',
  "Errl's got your back.",
  'Pulled together by chance and light.',
  'Fresh transmissions detected.'
];

export default function NotificationsMenu({
  open,
  onClose,
  unreadCount,
  items,
  status,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  anchor = 'right',
}) {
  const router = useRouter();
  const [currentUsername, setCurrentUsername] = useState(null);
  const [preferredColorIndex, setPreferredColorIndex] = useState(null);
  const [deletingNotificationId, setDeletingNotificationId] = useState(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const hasItems = items && items.length > 0;
  
  const usernameColorIndex = useMemo(() => {
    if (!currentUsername) return null;
    return getUsernameColorIndex(currentUsername, { preferredColorIndex });
  }, [currentUsername, preferredColorIndex]);
  const title = useMemo(() => {
    if (unreadCount > 0) return `Notifications (${unreadCount})`;
    return 'Notifications';
  }, [unreadCount]);

  const tagline = useMemo(() => {
    const d = new Date();
    const seed = (d.getDate() + d.getMonth() * 31 + (currentUsername || '').length) % ERL_TAGLINES.length;
    return ERL_TAGLINES[Math.abs(seed)] || ERL_TAGLINES[0];
  }, [open, currentUsername]);

  // Fetch current user's username and color preference
  useEffect(() => {
    if (open) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data?.user?.username) {
            setCurrentUsername(data.user.username);
            setPreferredColorIndex(data.user.preferredUsernameColorIndex ?? null);
          }
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }, [open]);

  const handleDeleteNotification = async (notificationId) => {
    setDeletingNotificationId(notificationId);
    try {
      const res = await fetch(`/api/notifications/${notificationId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const payload = await res.json();
      if (res.ok) {
        // Refresh notifications list
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        alert('Failed to delete notification');
      }
    } catch (e) {
      alert('Failed to delete notification');
    } finally {
      setDeletingNotificationId(null);
    }
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes notifications-refresh-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    <div
      className="card notifications-popover notifications-popover-errl"
      style={{
        position: 'absolute',
        right: anchor === 'right' ? 0 : 'auto',
        left: anchor === 'left' ? 0 : 'auto',
        top: 'calc(100% + 8px)',
        width: 380,
        maxWidth: 'min(380px, calc(100vw - 16px))',
        zIndex: 1100,
        padding: '20px',
        maxHeight: 'min(80vh, 600px)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        // Ensure it doesn't overflow viewport - will be overridden by CSS on mobile
        transform: anchor === 'right' ? 'translateX(0)' : 'none'
      }}
      role="menu"
      aria-label={title}
    >
      {/* Header: user + tagline (left), Account/Profile (right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          {currentUsername ? (
            <>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
                Hey, <span className={usernameColorIndex !== null ? `username username--${usernameColorIndex}` : ''} style={{ color: usernameColorIndex === null ? 'inherit' : undefined }}>{currentUsername}</span>
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.4, color: 'var(--muted)', background: 'transparent', border: 'none', padding: 0, margin: 0, borderRadius: 0, boxShadow: 'none' }}>
                {tagline}
              </div>
            </>
          ) : (
            <div className="muted" style={{ fontSize: '12px' }}>Loading…</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push('/account?tab=account');
            }}
            style={{ fontSize: '12px', padding: '6px 10px', whiteSpace: 'nowrap' }}
          >
            Account
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push('/account?tab=profile');
            }}
            style={{ fontSize: '12px', padding: '6px 10px', whiteSpace: 'nowrap' }}
          >
            Profile
          </button>
        </div>
      </div>

      {/* Title and refresh button row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong style={{ fontSize: '14px' }}>{title}</strong>
        <button
          type="button"
          onClick={onRefresh}
          disabled={status === 'loading'}
          title="Refresh"
          style={{
            width: 12,
            height: 12,
            minWidth: 12,
            minHeight: 12,
            padding: 0,
            margin: 0,
            background: 'transparent',
            border: 'none',
            borderRadius: 4,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            opacity: status === 'loading' ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted)',
            boxShadow: 'none',
            transition: 'color 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (status !== 'loading') {
              e.currentTarget.style.color = 'var(--text)';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(52, 225, 255, 0.35)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--muted)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              animation: status === 'loading' ? 'notifications-refresh-spin 1s linear infinite' : 'none',
              transition: status === 'loading' ? 'none' : 'transform 0.2s ease'
            }}
          >
            <path
              d="M13.5 2.5L12.5 5.5L9.5 4.5M2.5 13.5L3.5 10.5L6.5 11.5M11.5 2.5C10.3 1.8 8.9 1.5 7.5 1.5C4.2 1.5 1.5 4.2 1.5 7.5C1.5 10.8 4.2 13.5 7.5 13.5C10.8 13.5 13.5 10.8 13.5 7.5C13.5 6.1 13.2 4.7 12.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Notifications list - scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, marginBottom: '12px', position: 'relative', zIndex: 1 }}>
        {!hasItems ? (
          <div className="muted" style={{ padding: '16px 12px', textAlign: 'center', overflowWrap: 'break-word', wordWrap: 'break-word', lineHeight: '1.5', fontSize: '14px' }}>No notifications yet. The goo is quiet.</div>
        ) : (
          <div className="list" style={{ gap: '8px' }}>
            {items.map((n) => {
              const isUnread = !n.read_at;
              let href = '#';
              let label = 'Notification';
              
              const actor = n.actor_username || 'Someone';
              if (n.type === 'welcome' && n.target_type === 'account') {
                href = '/account';
                label = 'Welcome! Click here to navigate to your account and check your notifications. Clicking the Errl logo in the header also opens this menu.';
              } else if (n.type === 'test' && n.target_type === 'system') {
                href = '/account';
                label = 'Test notification - system check';
              } else if (n.type === 'reply' && n.target_type === 'forum_thread') {
                href = `/lobby/${n.target_id}`;
                label = `${actor} replied to a thread`;
              } else if (n.type === 'reply' && n.target_type === 'project') {
                href = `/projects/${n.target_id}`;
                label = `${actor} replied to a project`;
              } else if (n.type === 'comment' && n.target_type === 'timeline_update') {
                href = `/announcements/${n.target_id}`;
                label = `${actor} commented on an announcement`;
              } else if (n.type === 'comment' && n.target_type === 'event') {
                href = `/events/${n.target_id}`;
                label = `${actor} commented on an event`;
              } else if (n.type === 'comment' && n.target_type === 'project') {
                href = `/projects/${n.target_id}`;
                label = `${actor} commented on a project`;
              } else if (n.type === 'comment' && n.target_type === 'music_post') {
                href = `/music/${n.target_id}`;
                label = `${actor} commented on a music post`;
              } else if (n.type === 'comment' && n.target_type === 'dev_log') {
                href = `/devlog/${n.target_id}`;
                label = `${actor} commented on a dev log`;
              } else if (n.type === 'comment' && ['lore', 'memories', 'lore-memories', 'art', 'bugs', 'rant', 'nostalgia', 'about'].includes(n.target_type)) {
                href = `/${n.target_type}/${n.target_id}`;
                label = `${actor} commented on a post`;
              }
              
              return (
                <a
                  key={n.id}
                  href={href}
                  onClick={async (e) => {
                    e.preventDefault(); // Always prevent default, even for '#'
                    if (href === '#') return;
                    onClose();
                    await onMarkRead(n.id);
                    window.location.href = href;
                  }}
                  style={{ 
                    textDecoration: 'none',
                    display: 'block',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isUnread ? '1px solid rgba(52, 225, 255, 0.4)' : '1px solid rgba(22, 58, 74, 0.4)',
                    background: isUnread ? 'rgba(52, 225, 255, 0.05)' : 'rgba(4, 16, 23, 0.5)',
                    transition: 'all 0.2s ease',
                    overflowWrap: 'break-word',
                    wordWrap: 'break-word',
                    cursor: href === '#' ? 'default' : 'pointer',
                    boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (href !== '#') {
                      e.currentTarget.style.background = isUnread ? 'rgba(52, 225, 255, 0.15)' : 'rgba(4, 16, 23, 0.8)';
                      e.currentTarget.style.borderColor = isUnread ? 'rgba(52, 225, 255, 0.6)' : 'rgba(22, 58, 74, 0.6)';
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(52, 225, 255, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isUnread ? 'rgba(52, 225, 255, 0.05)' : 'rgba(4, 16, 23, 0.5)';
                    e.currentTarget.style.borderColor = isUnread ? 'rgba(52, 225, 255, 0.4)' : 'rgba(22, 58, 74, 0.4)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', position: 'relative' }}>
                    <span style={{ flex: 1, fontSize: '14px', lineHeight: '1.4', overflowWrap: 'break-word', wordWrap: 'break-word', minWidth: 0 }}>{label}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--muted)', fontWeight: 'normal', background: 'transparent', border: 'none', padding: 0, margin: 0, borderRadius: 0, boxShadow: 'none', pointerEvents: 'none' }} suppressHydrationWarning>
                        {formatTimeAgo(n.created_at)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteNotification(n.id);
                        }}
                        disabled={deletingNotificationId === n.id}
                        title="Delete notification"
                        style={{
                          width: 10,
                          height: 10,
                          minWidth: 10,
                          minHeight: 10,
                          padding: 0,
                          margin: 0,
                          background: 'transparent',
                          border: 'none',
                          borderRadius: 2,
                          cursor: deletingNotificationId === n.id ? 'not-allowed' : 'pointer',
                          opacity: deletingNotificationId === n.id ? 0.5 : 0.4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--muted)',
                          boxShadow: 'none',
                          transition: 'opacity 0.2s ease, color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (deletingNotificationId !== n.id) {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.color = '#ff6b6b';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.4';
                          e.currentTarget.style.color = 'var(--muted)';
                        }}
                      >
                        <TrashIcon size={10} />
                      </button>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear All confirmation modal */}
      {showClearAllModal && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setShowClearAllModal(false)}
          onConfirm={async () => {
            setShowClearAllModal(false);
            if (onClearAll) {
              await onClearAll();
            }
          }}
          itemType="all notifications"
        />
      )}

      {/* Footer with mark all read, clear, and close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <button 
            type="button" 
            onClick={onMarkAllRead} 
            disabled={unreadCount === 0}
            style={{ fontSize: '12px', padding: '6px 10px', opacity: unreadCount === 0 ? 0.5 : 1, flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            Mark all read
          </button>
          <button 
            type="button" 
            onClick={() => setShowClearAllModal(true)}
            disabled={!hasItems}
            style={{ fontSize: '12px', padding: '6px 10px', opacity: !hasItems ? 0.5 : 1, flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            Clear
          </button>
        </div>
        <button 
          type="button" 
          onClick={onClose}
          style={{ fontSize: '12px', padding: '6px 10px', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Close
        </button>
      </div>
    </div>
    </>
  );
}

