'use client';

import { useEffect } from 'react';

export default function ThreadViewTracker({ threadId }) {
  useEffect(() => {
    // Increment view count
    fetch(`/api/forum/${threadId}/view`, { method: 'POST' }).catch(() => {});
    
    // Mark thread as read
    fetch(`/api/forum/${threadId}/mark-read`, { method: 'POST' }).catch(() => {});
  }, [threadId]);

  return null;
}
