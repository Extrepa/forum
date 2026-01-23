'use client';

import { useEffect } from 'react';

/**
 * ViewTracker - Tracks page views by calling the view API endpoint
 * Only counts new views (client-side tracking)
 */
export default function ViewTracker({ contentType, contentId }) {
  useEffect(() => {
    if (!contentType || !contentId) return;

    // Call view API to increment view count
    fetch(`/api/${contentType}/${contentId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(() => {
      // Silently fail if view tracking fails
    });
  }, [contentType, contentId]);

  return null; // This component doesn't render anything
}
