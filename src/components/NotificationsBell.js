'use client';

import { useEffect, useMemo, useState } from 'react';

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

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | error

  const hasItems = items && items.length > 0;

  const title = useMemo(() => {
    if (unreadCount > 0) return `Notifications (${unreadCount})`;
    return 'Notifications';
  }, [unreadCount]);

  const refresh = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/notifications', { method: 'GET' });
      const payload = await res.json();
      setUnreadCount(Number(payload.unreadCount || 0));
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setStatus('idle');
    } catch (e) {
      setStatus('error');
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      await refresh();
    };
    run();
    const id = setInterval(() => {
      run();
    }, 25000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (id) => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const payload = await res.json();
      if (res.ok) {
        setUnreadCount(Number(payload.unreadCount || 0));
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: Date.now() } : n)));
      }
    } catch (e) {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
      const payload = await res.json();
      if (res.ok) {
        setUnreadCount(Number(payload.unreadCount || 0));
        setItems((prev) => prev.map((n) => ({ ...n, read_at: Date.now() })));
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={async () => {
          const next = !open;
          setOpen(next);
          if (next) {
            await refresh();
          }
        }}
        className={unreadCount > 0 ? 'active' : ''}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : 'false'}
        title={title}
      >
        Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
      </button>

      {open ? (
        <div
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 340,
            maxWidth: '90vw',
            zIndex: 1100,
            padding: 12
          }}
          role="menu"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <strong>Notifications</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={refresh} disabled={status === 'loading'}>
                Refresh
              </button>
              <button type="button" onClick={markAllRead} disabled={unreadCount === 0}>
                Mark all read
              </button>
              <button type="button" onClick={() => setOpen(false)}>
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
                    n.type === 'reply' && n.target_type === 'forum_thread' ? `/forum/${n.target_id}` : '#';
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
                        await markRead(n.id);
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
      ) : null}
    </div>
  );
}

