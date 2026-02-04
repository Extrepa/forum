'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUsernameColorIndex } from '../lib/usernameColor';
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

const POST_ROUTE_OVERRIDES = {
  art: '/art/',
  nostalgia: '/nostalgia/',
  bugs: '/bugs/',
  rant: '/rant/',
  lore: '/lore/',
  memories: '/lore-memories/',
  about: '/about/',
};

const POST_DISPLAY_LABELS = {
  art: 'art post',
  nostalgia: 'nostalgia post',
  bugs: 'bug report',
  rant: 'rant',
  lore: 'lore post',
  memories: 'memory',
  about: 'about entry',
};

const CONTENT_BASE_HREFS = {
  forum_thread: '/lobby/',
  music_post: '/music/',
  event: '/events/',
  project: '/projects/',
  dev_log: '/devlog/',
  timeline_update: '/announcements/',
  timeline_comment: '/announcements/',
  event_comment: '/events/',
  music_comment: '/music/',
  project_reply: '/projects/',
  dev_log_comment: '/devlog/',
  post_comment: '/',
};

const CONTENT_DISPLAY_LABELS = {
  forum_thread: 'thread',
  forum_reply: 'thread',
  dev_log: 'dev log',
  dev_log_comment: 'dev log',
  music_post: 'music post',
  music_comment: 'music post',
  project: 'project',
  project_reply: 'project',
  timeline_update: 'announcement',
  timeline_comment: 'announcement',
  event: 'event',
  event_comment: 'event',
  art: 'art post',
  bugs: 'bug report',
  rant: 'rant',
  nostalgia: 'nostalgia post',
  lore: 'lore post',
  memories: 'memory',
  about: 'about entry',
  post: 'post',
};

const resolveContentHref = (targetType, targetId, postCategory) => {
  if (targetType === 'post') {
    if (postCategory && POST_ROUTE_OVERRIDES[postCategory]) {
      return `${POST_ROUTE_OVERRIDES[postCategory]}${targetId}`;
    }
    return '#';
  }
  return `${CONTENT_BASE_HREFS[targetType] || '/'}${targetId}`;
};

const resolveContentLabel = (targetType, postCategory) => {
  if (targetType === 'post') {
    if (postCategory && POST_DISPLAY_LABELS[postCategory]) {
      return POST_DISPLAY_LABELS[postCategory];
    }
    return 'post';
  }
  return CONTENT_DISPLAY_LABELS[targetType] || 'content';
};

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
  const [signingOut, setSigningOut] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const hasItems = items && items.length > 0;
  const handleClearAll = async () => {
    if (!hasItems) return;
    if (typeof window !== 'undefined') {
      if (!window.confirm('Are you sure?')) return;
    }
    if (onClearAll) {
      await onClearAll();
    }
  };
  
  const usernameColorIndex = useMemo(() => {
    if (!currentUsername) return null;
    return getUsernameColorIndex(currentUsername, { preferredColorIndex });
  }, [currentUsername, preferredColorIndex]);
  const title = useMemo(() => {
    if (unreadCount > 0) return `Notifications (${unreadCount})`;
    return 'Notifications';
  }, [unreadCount]);

  const hasUnread = unreadCount > 0;
  const showingClearButton = hasItems && !hasUnread;
  const primaryButtonDisabled = showingClearButton ? !onClearAll : !hasUnread;

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

  // Calculate popover position on mobile to align with logo and prevent overflow
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    
    const updatePosition = () => {
      if (window.innerWidth > 640) {
        setPopoverStyle({});
        return;
      }

      const trigger = document.querySelector('.notifications-logo-trigger');
      if (!trigger) {
        setPopoverStyle({
          position: 'absolute',
          right: 0,
          left: 'auto',
          top: 'calc(100% + 8px)',
          width: 'min(300px, 92vw)',
          maxWidth: 'min(300px, 92vw)',
          minWidth: 'min(240px, 92vw)',
          margin: 0,
        });
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const popoverWidth = 380;
      const viewportWidth = window.innerWidth;
      const margin = 12;
      const maxPopoverWidth = viewportWidth - margin * 2;
      const finalWidth = Math.min(popoverWidth, maxPopoverWidth);
      const logoRightEdge = viewportWidth - triggerRect.right;
      const spaceNeeded = finalWidth + margin;
      const spaceAvailable = triggerRect.right;

      let actualRight;
      if (spaceAvailable >= spaceNeeded && logoRightEdge >= margin) {
        actualRight = logoRightEdge;
      } else {
        const centeredRight = (viewportWidth - finalWidth) / 2;
        actualRight = centeredRight;
      }

      const leftEdgePosition = viewportWidth - actualRight - finalWidth;
      if (leftEdgePosition < margin) {
        actualRight = viewportWidth - finalWidth - margin;
      }

      actualRight = Math.max(margin, Math.min(actualRight, viewportWidth - finalWidth - margin));
      const top = triggerRect.bottom + 4;

      setPopoverStyle({
        position: 'fixed',
        top: `${top}px`,
        right: `${actualRight}px`,
        left: 'auto',
        width: `${finalWidth}px`,
        maxWidth: `${finalWidth}px`,
        minWidth: `${finalWidth}px`,
        height: 'auto',
        maxHeight: 'calc(100vh - 32px)',
      });
    };
    
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(updatePosition, 0);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
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

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    if (onClose) {
      onClose();
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // ignore errors but keep trying to redirect
    }
    if (typeof window !== 'undefined') {
      window.location.href = 'https://forum.errl.wtf';
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
      ref={popoverRef}
      className="card notifications-popover notifications-popover-errl"
      style={{
        position: 'absolute',
        right: anchor === 'right' ? 0 : 'auto',
        left: anchor === 'left' ? 0 : 'auto',
        top: 'calc(100% + 8px)',
        width: 300,
        maxWidth: 'min(300px, 92vw)',
        minWidth: 240,
        zIndex: 1100,
        padding: '14px',
        maxHeight: 'min(86vh, 720px)',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        ...popoverStyle
      }}
      role="menu"
      aria-label={title}
    >
      {/* Header: greeting (left) and sign out (right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          {currentUsername ? (
            <div style={{ fontSize: '17px', fontWeight: 700 }}>
              Hey, <span className={usernameColorIndex !== null ? `username username--${usernameColorIndex}` : ''} style={{ color: usernameColorIndex === null ? 'inherit' : undefined }}>{currentUsername}</span>
            </div>
          ) : (
            <div className="muted" style={{ fontSize: '12px' }}>Loading…</div>
          )}
        </div>
        <span
          role="button"
          tabIndex={signingOut ? -1 : 0}
          onClick={signingOut ? undefined : handleSignOut}
          onKeyDown={(event) => {
            if (signingOut) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleSignOut();
            }
          }}
          style={{
            fontSize: '11px',
            background: 'transparent',
            color: signingOut ? 'rgba(255, 255, 255, 0.5)' : 'var(--muted)',
            fontWeight: 600,
            cursor: signingOut ? 'not-allowed' : 'pointer',
            letterSpacing: '0.04em',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'underline'
          }}
          onMouseEnter={(e) => {
            if (!signingOut) {
              e.currentTarget.style.color = 'var(--text)';
            }
          }}
          onMouseLeave={(e) => {
            if (!signingOut) {
              e.currentTarget.style.color = 'var(--muted)';
            }
          }}
          aria-disabled={signingOut}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', marginBottom: '12px' }}>
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push('/account?tab=account');
          }}
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            whiteSpace: 'nowrap',
            borderRadius: '999px',
            border: 'none',
            background: 'linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9))',
            color: '#001018',
            fontWeight: 600,
            boxShadow: '0 0 10px rgba(52, 225, 255, 0.35)',
          }}
        >
          Account
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push('/account?tab=profile');
          }}
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            whiteSpace: 'nowrap',
            borderRadius: '999px',
            border: 'none',
            background: 'linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9))',
            color: '#001018',
            fontWeight: 600,
            boxShadow: '0 0 10px rgba(52, 225, 255, 0.35)',
          }}
        >
          Edit Profile
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            if (currentUsername) {
              router.push(`/profile/${encodeURIComponent(currentUsername)}`);
            } else {
              router.push('/account?tab=profile');
            }
          }}
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            whiteSpace: 'nowrap',
            borderRadius: '999px',
            border: 'none',
            background: 'linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9))',
            color: '#001018',
            fontWeight: 600,
            boxShadow: '0 0 10px rgba(52, 225, 255, 0.35)',
          }}
        >
          View Profile
        </button>
      </div>

      {/* Title and refresh button row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong style={{ fontSize: '14px', letterSpacing: '0.02em' }}>{title}</strong>
        <button
          type="button"
          onClick={async () => {
            if (status === 'loading' || refreshing) return;
            setRefreshing(true);
            try {
              await onRefresh?.();
            } finally {
              setRefreshing(false);
            }
          }}
          disabled={status === 'loading' || refreshing}
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
            cursor: status === 'loading' || refreshing ? 'not-allowed' : 'pointer',
            opacity: status === 'loading' || refreshing ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted)',
            boxShadow: 'none',
            transition: 'color 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (status !== 'loading' && !refreshing) {
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
              animation: status === 'loading' || refreshing ? 'notifications-refresh-spin 1s linear infinite' : 'none',
              transition: status === 'loading' || refreshing ? 'none' : 'transform 0.2s ease'
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
      <div style={{ flex: '0 1 auto', overflowY: 'auto', overflowX: 'hidden', maxHeight: '120px', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
        {!hasItems ? (
          <div className="muted" style={{ padding: '16px 12px', textAlign: 'center', overflowWrap: 'break-word', wordWrap: 'break-word', lineHeight: '1.5', fontSize: '14px' }}>No notifications yet. The goo is quiet.</div>
        ) : (
          <div className="list" style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)', overflow: 'hidden', background: 'rgba(2, 5, 10, 0.6)' }}>
            {items.map((n, index) => {
              const isUnread = !n.read_at;
              const isLastItem = index === items.length - 1;
              let href = '#';
              let label = 'Notification';
              
              const actor = n.actor_username || 'Someone';
              if (n.type === 'welcome' && n.target_type === 'account') {
                href = '/account';
                label = 'Welcome! Click here to navigate to your account and check your notifications. Clicking the Errl logo in the header also opens this menu.';
              } else if (n.type === 'test' && n.target_type === 'system') {
                href = '/account';
                label = 'Test notification - system check';
              } else if (n.type === 'admin_signup' && n.target_type === 'user') {
                href = `/profile/${n.target_id}`;
                label = `New user signed up: ${actor}`;
              } else if (n.type === 'admin_post' && n.target_type === 'forum_thread') {
                href = `/lobby/${n.target_id}`;
                label = `New forum thread by ${actor}`;
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
              } else if (n.type === 'rsvp' && n.target_type === 'event') {
                href = `/events/${n.target_id}`;
                label = `${actor} is attending your event`;
              } else if (n.type === 'like') {
                const resolvedTarget = n.target_type === 'post'
                  ? (n.target_post_category || 'post')
                  : n.target_type;
                href = resolveContentHref(resolvedTarget, n.target_id, n.target_post_category);
                const displayType = resolveContentLabel(resolvedTarget, n.target_post_category);
                label = `${actor} liked your ${displayType}`;
              } else if (n.type === 'update' && n.target_type === 'project') {
                href = `/projects/${n.target_id}`;
                label = `${actor} posted an update to a project`;
              } else if (n.type === 'mention') {
                const resolvedTarget = n.target_type === 'post'
                  ? (n.target_post_category || 'post')
                  : n.target_type;
                href = resolveContentHref(resolvedTarget, n.target_id, n.target_post_category);
                const displayType = resolveContentLabel(resolvedTarget, n.target_post_category);
                label = `${actor} mentioned you in a ${displayType}`;
              }
              
              const baseBackground = isUnread ? 'rgba(52, 225, 255, 0.08)' : 'rgba(4, 16, 23, 0.5)';
              const hoverBackground = isUnread ? 'rgba(52, 225, 255, 0.15)' : 'rgba(4, 16, 23, 0.8)';
              const separatorColor = 'rgba(255, 255, 255, 0.08)';
              
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
                    borderRadius: 0,
                    border: 'none',
                    borderBottom: isLastItem ? 'none' : `1px solid ${separatorColor}`,
                    background: baseBackground,
                    transition: 'background 0.2s ease',
                    overflowWrap: 'break-word',
                    wordWrap: 'break-word',
                    cursor: href === '#' ? 'default' : 'pointer',
                    boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (href !== '#') {
                      e.currentTarget.style.background = hoverBackground;
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(52, 225, 255, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = baseBackground;
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

      {/* Footer with mark all read, clear, and close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
        <button 
          type="button" 
          onClick={() => {
            if (showingClearButton) {
              handleClearAll();
            } else {
              onMarkAllRead?.();
            }
          }}
          disabled={primaryButtonDisabled}
          style={{
            fontSize: '11px',
            padding: '6px 10px',
            opacity: primaryButtonDisabled ? 0.5 : 1,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            borderRadius: '999px',
            border: 'none',
            background: 'linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9))',
            color: '#001018',
            fontWeight: 600,
            boxShadow: '0 0 10px rgba(52, 225, 255, 0.35)',
          }}
        >
          {showingClearButton ? 'Clear' : 'Mark all as read'}
        </button>
        <button 
          type="button" 
          onClick={onClose}
          style={{
            fontSize: '11px',
            padding: '6px 10px',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            borderRadius: '999px',
            border: 'none',
            background: 'linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9))',
            color: '#001018',
            fontWeight: 600,
            boxShadow: '0 0 10px rgba(52, 225, 255, 0.35)',
          }}
        >
          Close
        </button>
      </div>
    </div>
    </>
  );
}
