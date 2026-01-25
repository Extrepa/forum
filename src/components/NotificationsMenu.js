'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [currentUsername, setCurrentUsername] = useState(null);
  const hasItems = items && items.length > 0;
  const title = useMemo(() => {
    if (unreadCount > 0) return `Notifications (${unreadCount})`;
    return 'Notifications';
  }, [unreadCount]);

  // Fetch current user's username for profile link
  useEffect(() => {
    if (open) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data?.user?.username) {
            setCurrentUsername(data.user.username);
          }
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="card notifications-popover notifications-popover-errl"
      style={{
        position: 'absolute',
        right: anchor === 'right' ? 0 : 'auto',
        left: anchor === 'left' ? 0 : 'auto',
        top: 'calc(100% + 8px)',
        width: 380,
        maxWidth: '90vw',
        zIndex: 1100,
        padding: '20px',
        maxHeight: 'min(80vh, 600px)',
        display: 'flex',
        flexDirection: 'column'
      }}
      role="menu"
      aria-label={title}
    >
      {/* Header with title and action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: '16px', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '16px', overflowWrap: 'break-word', wordWrap: 'break-word', flex: '1 1 auto', minWidth: 0 }}>{title}</strong>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
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
          <button 
            type="button" 
            onClick={onRefresh} 
            disabled={status === 'loading'}
            style={{ fontSize: '12px', padding: '6px 10px', whiteSpace: 'nowrap' }}
          >
            {status === 'loading' ? '...' : 'Refresh'}
          </button>
        </div>
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
                    wordWrap: 'break-word'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isUnread ? 'rgba(52, 225, 255, 0.1)' : 'rgba(4, 16, 23, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isUnread ? 'rgba(52, 225, 255, 0.05)' : 'rgba(4, 16, 23, 0.5)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ flex: 1, fontSize: '14px', lineHeight: '1.4', overflowWrap: 'break-word', wordWrap: 'break-word', minWidth: 0 }}>{label}</span>
                    <span className="muted" style={{ whiteSpace: 'nowrap', fontSize: '12px', flexShrink: 0 }}>
                      {formatTimeAgo(n.created_at)}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with mark all read and close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <button 
          type="button" 
          onClick={onMarkAllRead} 
          disabled={unreadCount === 0}
          style={{ fontSize: '12px', padding: '6px 10px', opacity: unreadCount === 0 ? 0.5 : 1 }}
        >
          Mark all read
        </button>
        <button 
          type="button" 
          onClick={onClose}
          style={{ fontSize: '12px', padding: '6px 10px' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

