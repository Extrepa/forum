'use client';

import { useMemo } from 'react';

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

export default function NotificationsMenu({
  open,
  onClose,
  unreadCount,
  items,
  status,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  anchor = 'right',
}) {
  const hasItems = items && items.length > 0;
  const title = useMemo(() => {
    if (unreadCount > 0) return `Notifications (${unreadCount})`;
    return 'Notifications';
  }, [unreadCount]);

  if (!open) return null;

  return (
    <div
      className="card notifications-popover"
      style={{
        position: 'absolute',
        right: anchor === 'right' ? 0 : 'auto',
        left: anchor === 'left' ? 0 : 'auto',
        top: 'calc(100% + 8px)',
        width: 340,
        maxWidth: '90vw',
        zIndex: 1100,
        padding: 12
      }}
      role="menu"
      aria-label={title}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <strong>{title}</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onRefresh} disabled={status === 'loading'}>
            Refresh
          </button>
          <button type="button" onClick={onMarkAllRead} disabled={unreadCount === 0}>
            Mark all read
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        {!hasItems ? (
          <div className="muted">No notifications yet.</div>
        ) : (
          <div className="list">
            {items.map((n) => {
              const isUnread = !n.read_at;
              const href =
                n.type === 'reply' && n.target_type === 'forum_thread' ? `/lobby/${n.target_id}` : '#';
              const label =
                n.type === 'reply' && n.target_type === 'forum_thread'
                  ? `${n.actor_username || 'Someone'} replied to a thread`
                  : 'Notification';
              return (
                <a
                  key={n.id}
                  href={href}
                  className={isUnread ? 'active' : ''}
                  onClick={async (e) => {
                    if (href === '#') return;
                    e.preventDefault();
                    await onMarkRead(n.id);
                    window.location.href = href;
                  }}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span>{label}</span>
                    <span className="muted" style={{ whiteSpace: 'nowrap' }}>
                      {formatTimeAgo(n.created_at)}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

