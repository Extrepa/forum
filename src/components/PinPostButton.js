'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PIN_ICON = '\u{1F4CC}'; // pushpin

function pinTypeFor(postType) {
  const map = {
    thread: 'forum_thread',
    timeline: 'timeline_update',
    post: 'post',
    event: 'event',
    music: 'music_post',
    project: 'project',
    devlog: 'dev_log',
  };
  return map[postType] || null;
}

export default function PinPostButton({ postId, postType = 'post', initialPinned = false, onToggled }) {
  const router = useRouter();
  const [isPinned, setIsPinned] = useState(!!initialPinned);
  const [isSaving, setIsSaving] = useState(false);

  const apiType = pinTypeFor(postType);
  if (!apiType) {
    return null;
  }

  const handleToggle = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/posts/${postId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: apiType }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || 'Failed to update pin status');
        return;
      }
      const nextPinned = !!data.is_pinned;
      setIsPinned(nextPinned);
      if (onToggled) onToggled(nextPinned);
      router.refresh();
    } catch (e) {
      alert('Error updating pin status');
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <button
        type="button"
        onClick={handleToggle}
        className="button"
        style={{
          fontSize: '16px',
          padding: '6px 10px',
          minWidth: '44px',
          minHeight: '44px',
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      title={isPinned ? 'Unpin from top' : 'Pin to top'}
      aria-label={isPinned ? 'Unpin from top' : 'Pin to top'}
      disabled={isSaving}
    >
      {PIN_ICON}
    </button>
  );
}
