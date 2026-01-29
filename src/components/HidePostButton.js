'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EYE_OPEN = '👁️';
const EYE_CLOSED = '🙈';

function hideUrlFor(postType, postId) {
  if (postType === 'thread') return `/api/forum/${postId}/hide`;
  if (postType === 'project') return `/api/projects/${postId}/hide`;
  if (postType === 'event') return `/api/events/${postId}/hide`;
  if (postType === 'music') return `/api/music/${postId}/hide`;
  if (postType === 'devlog') return `/api/devlog/${postId}/hide`;
  if (postType === 'post') return `/api/posts/${postId}/hide`;
  if (postType === 'timeline') return `/api/timeline/${postId}/hide`;
  return null;
}

export default function HidePostButton({ postId, postType = 'post', initialHidden = false, onToggled }) {
  const router = useRouter();
  const [isHidden, setIsHidden] = useState(!!initialHidden);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async () => {
    if (isSaving) return;
    const url = hideUrlFor(postType, postId);
    if (!url) {
      alert('Hide not yet implemented for this post type');
      return;
    }

    const nextHidden = !isHidden;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.set('hidden', nextHidden ? '1' : '0');
      const response = await fetch(url, { method: 'POST', body: formData });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Failed to update hidden status');
        return;
      }
      setIsHidden(nextHidden);
      if (onToggled) {
        onToggled(nextHidden);
      }
      router.refresh();
    } catch (e) {
      alert('Error updating hidden status');
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
        padding: '4px 8px',
        minWidth: '44px',
        minHeight: '34px',
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      title={isHidden ? 'Show post' : 'Hide post'}
      aria-label={isHidden ? 'Show post' : 'Hide post'}
      disabled={isSaving}
    >
      {isHidden ? EYE_CLOSED : EYE_OPEN}
    </button>
  );
}
