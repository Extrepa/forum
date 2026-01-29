'use client';

import { useEffect, useRef } from 'react';

export default function ActiveTimeTracker({ enabled }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isMounted = true;

    const ping = () => {
      if (!isMounted) return;
      fetch('/api/account/active-time', { method: 'POST', keepalive: true }).catch(() => {});
    };

    ping();
    intervalRef.current = setInterval(ping, 60 * 1000);

    const handlePageHide = () => {
      if (!enabled) return;
      if (navigator?.sendBeacon) {
        try {
          navigator.sendBeacon('/api/account/active-time');
          return;
        } catch (e) {
          // Fall back to fetch.
        }
      }
      fetch('/api/account/active-time', { method: 'POST', keepalive: true }).catch(() => {});
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [enabled]);

  return null;
}
