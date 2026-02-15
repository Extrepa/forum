'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postTypeLabel, postTypePath, contentTypeLabel, contentTypeViewPath } from '../lib/contentTypes';
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

const CONTENT_BASE_HREFS = {
  forum_reply: '/lobby/',
  dev_log_comment: '/devlog/',
  music_comment: '/music/',
  project_reply: '/projects/',
  timeline_comment: '/announcements/',
  event_comment: '/events/',
  post_comment: '/',
};

const CONTENT_DISPLAY_LABELS = {
  forum_reply: 'thread',
  dev_log_comment: 'dev log',
  music_comment: 'music post',
  project_reply: 'project',
  timeline_comment: 'announcement',
  event_comment: 'event',
};

const resolveContentHref = (targetType, targetId, postCategory) => {
  if (targetType === 'post') {
    if (postCategory) return `${postTypePath(postCategory)}/${targetId}`;
    return '#';
  }
  const basePath = CONTENT_BASE_HREFS[targetType];
  if (basePath) {
    return `${basePath}${targetId}`;
  }
  return contentTypeViewPath(targetType, { id: targetId, type: postCategory }) || '#';
};

const resolveContentLabel = (targetType, postCategory) => {
  if (targetType === 'post') {
    return postCategory ? postTypeLabel(postCategory) : 'Post';
  }
  if (CONTENT_DISPLAY_LABELS[targetType]) return CONTENT_DISPLAY_LABELS[targetType];
  return contentTypeLabel(targetType, { type: postCategory }) || 'content';
};

const adminPostTypeLabel = (targetType, postCategory) => {
  if (targetType === 'post') {
    return `${postTypeLabel(postCategory || 'post')} post`;
  }
  if (targetType === 'forum_thread') return 'forum thread';
  if (targetType === 'event') return 'event';
  if (targetType === 'project') return 'project';
  if (targetType === 'music_post') return 'music post';
  if (targetType === 'dev_log') return 'dev log';
  if (targetType === 'timeline_update') return 'announcement';
  return 'post';
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
}) {
  const router = useRouter();
  const [deletingNotificationId, setDeletingNotificationId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const hasItems = items && items.length > 0;
  const panelButtonStyle = {
    fontSize: '11px',
    padding: '6px 11px',
    background: 'rgba(2, 7, 10, 0.45)',
    border: '1px solid rgba(52, 225, 255, 0.28)',
    borderRadius: '999px',
    color: 'var(--muted)',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: 'none',
    transition: 'border-color 0.2s ease, color 0.2s ease, background 0.2s ease',
  };
  const handleClearAll = async () => {
    if (!hasItems) return;
    if (typeof window !== 'undefined') {
      if (!window.confirm('Are you sure?')) return;
    }
    if (onClearAll) {
      await onClearAll();
    }
  };
  
  const hasUnread = unreadCount > 0;

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
      className="neon-outline-card notifications-popover notifications-popover-errl"
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 6px)',
        width: 284,
        maxWidth: 'min(284px, 92vw)',
        minWidth: 232,
        zIndex: 1100,
        padding: '10px',
        maxHeight: 'min(86vh, 720px)',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
      role="menu"
      aria-label="Messages and notifications"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', lineHeight: 1.1 }}>
          Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </h3>
        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
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
              width: 16,
              height: 16,
              padding: 0,
              cursor: status === 'loading' || refreshing ? 'not-allowed' : 'pointer',
              opacity: status === 'loading' || refreshing ? 0.5 : 0.9,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
              borderRadius: 999,
              border: '1px solid rgba(52, 225, 255, 0.22)',
              background: 'rgba(2, 7, 10, 0.25)',
              boxShadow: 'none',
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ animation: status === 'loading' || refreshing ? 'notifications-refresh-spin 1s linear infinite' : 'none' }}
            >
              <path
                d="M13.5 2.5L12.5 5.5L9.5 4.5M2.5 13.5L3.5 10.5L6.5 11.5M11.5 2.5C10.3 1.8 8.9 1.5 7.5 1.5C4.2 1.5 1.5 4.2 1.5 7.5C1.5 10.8 4.2 13.5 7.5 13.5C10.8 13.5 13.5 10.8 13.5 7.5C13.5 6.1 13.2 4.7 12.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onMarkAllRead?.()}
            disabled={!hasUnread}
            style={{
              fontSize: '10px',
              padding: '4px 7px',
              borderRadius: 999,
              border: '1px solid rgba(52, 225, 255, 0.28)',
              background: 'rgba(2, 7, 10, 0.35)',
              color: 'var(--muted)',
              opacity: hasUnread ? 1 : 0.45,
              cursor: hasUnread ? 'pointer' : 'not-allowed',
              boxShadow: 'none',
            }}
          >
            Mark read
          </button>
        </div>
      </div>

      <div style={{ flex: '0 1 auto', overflowY: 'auto', overflowX: 'hidden', maxHeight: '160px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
        {!hasItems ? (
          <div className="muted" style={{ padding: '12px 10px', textAlign: 'center', overflowWrap: 'break-word', wordWrap: 'break-word', lineHeight: '1.4', fontSize: '12px' }}>No notifications yet.</div>
        ) : (
          <div className="list" style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: '12px', border: '1px solid rgba(52, 225, 255, 0.24)', overflow: 'hidden', background: 'rgba(2, 5, 10, 0.72)' }}>
            {items.map((n, index) => {
              const isUnread = !n.read_at;
              const isLastItem = index === items.length - 1;
              let href = '#';
              let label = 'Notification';
              
              const actor = n.actor_username || 'Someone';
              if (n.type === 'welcome' && n.target_type === 'account') {
                href = '/account';
                label = 'Account setup';
              } else if (n.type === 'navigation_tip' && n.target_type === 'system') {
                href = '#';
                label = 'Notifications are now in this Messages icon. Use the three-dot menu for Account, Profile, and Admin links.';
              } else if (n.type === 'broadcast' && n.target_type === 'system') {
                href = '#';
                label = String(n.target_id || 'Forum update');
              } else if (n.type === 'test' && n.target_type === 'system') {
                href = '/account';
                label = 'System notification';
              } else if (n.type === 'admin_signup' && n.target_type === 'user') {
                href = `/profile/${n.target_id}`;
                label = `New user signed up: ${actor}`;
              } else if (n.type === 'admin_post') {
                const resolvedTarget = n.target_type === 'post'
                  ? 'post'
                  : n.target_type;
                href = resolveContentHref(resolvedTarget, n.target_id, n.target_post_category);
                label = `New ${adminPostTypeLabel(n.target_type, n.target_post_category)} by ${actor}`;
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
              } else if (n.type === 'event_invite' && n.target_type === 'event') {
                href = `/events/${n.target_id}`;
                label = `${actor} invited you to an event`;
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
              
              const baseBackground = isUnread ? 'var(--bg-accent)' : 'var(--card)';
              const hoverBackground = isUnread ? 'var(--errl-surface)' : 'var(--bg-accent)';
              
              const canNavigate = href !== '#';

              return (
                <div
                  key={n.id}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!canNavigate) return;
                    onClose?.();
                    await onMarkRead?.(n.id);
                    router.push(href);
                  }}
                  onKeyDown={async (e) => {
                    if (!canNavigate) return;
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    onClose?.();
                    await onMarkRead?.(n.id);
                    router.push(href);
                  }}
                  role={canNavigate ? 'button' : undefined}
                  tabIndex={canNavigate ? 0 : -1}
                  style={{
                    display: 'block',
                    padding: '0 10px',
                    borderRadius: 0,
                    border: 'none',
                    borderBottom: isLastItem ? 'none' : '1px solid rgba(52, 225, 255, 0.2)',
                    background: baseBackground,
                    transition: 'background 0.2s ease',
                    overflowWrap: 'break-word',
                    wordWrap: 'break-word',
                    cursor: canNavigate ? 'pointer' : 'default',
                    boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (canNavigate) {
                      e.currentTarget.style.background = hoverBackground;
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = baseBackground;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', position: 'relative' }}>
                      <span style={{ flex: 1, fontSize: '12px', lineHeight: '1.35', overflowWrap: 'break-word', wordWrap: 'break-word', minWidth: 0 }}>{label}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--muted)', fontWeight: 500, background: 'transparent', border: 'none', padding: 0, margin: 0, borderRadius: 0, boxShadow: 'none', pointerEvents: 'none' }} suppressHydrationWarning>
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'nowrap', minWidth: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              onClose?.();
              router.push('/messages');
            }}
            style={{
              ...panelButtonStyle,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 52, 245, 0.55)';
              e.currentTarget.style.color = 'var(--ink)';
              e.currentTarget.style.background = 'rgba(13, 51, 68, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(52, 225, 255, 0.28)';
              e.currentTarget.style.color = 'var(--muted)';
              e.currentTarget.style.background = 'rgba(2, 7, 10, 0.45)';
            }}
          >
            Messages
          </button>
        <button
            type="button"
            onClick={handleClearAll}
            disabled={!hasItems}
            style={{
              ...panelButtonStyle,
              cursor: hasItems ? 'pointer' : 'not-allowed',
              opacity: hasItems ? 1 : 0.45,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 52, 245, 0.55)';
              e.currentTarget.style.color = 'var(--ink)';
              e.currentTarget.style.background = 'rgba(13, 51, 68, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(52, 225, 255, 0.28)';
              e.currentTarget.style.color = 'var(--muted)';
              e.currentTarget.style.background = 'rgba(2, 7, 10, 0.45)';
            }}
          >
            Clear
          </button>
        </div>
        <button 
          type="button"
          onClick={() => onClose?.()}
          style={{
            ...panelButtonStyle,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 52, 245, 0.55)';
            e.currentTarget.style.color = 'var(--ink)';
            e.currentTarget.style.background = 'rgba(13, 51, 68, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(52, 225, 255, 0.28)';
            e.currentTarget.style.color = 'var(--muted)';
            e.currentTarget.style.background = 'rgba(2, 7, 10, 0.45)';
          }}
        >
          Close
        </button>
      </div>
    </div>
    </>
  );
}
