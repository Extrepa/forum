'use client';

import { useEffect, useMemo, useState } from 'react';
import NotificationsMenu from './NotificationsMenu';

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | error

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

  const clearAll = async () => {
    try {
      const res = await fetch('/api/notifications/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const payload = await res.json();
      if (res.ok) {
        setUnreadCount(0);
        setItems([]);
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

      <NotificationsMenu
        open={open}
        onClose={() => setOpen(false)}
        unreadCount={unreadCount}
        items={items}
        status={status}
        onRefresh={refresh}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onClearAll={clearAll}
        anchor="right"
      />
    </div>
  );
}

