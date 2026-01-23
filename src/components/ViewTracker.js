'use client';

import { useEffect } from 'react';

/**
 * ViewTracker - Tracks page views by calling the view API endpoint
 * Also marks content as read for the current user
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

    // Mark as read for all content types
    fetch(`/api/${contentType}/${contentId}/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(() => {
      // Silently fail if mark-read endpoint doesn't exist yet
    });
  }, [contentType, contentId]);

  return null; // This component doesn't render anything
}
