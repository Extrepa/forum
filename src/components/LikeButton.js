'use client';

import { useState } from 'react';

export default function LikeButton({ postType, postId, initialLiked = false, initialCount = 0, size }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const isCompact = size === 'sm';

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_type: postType, post_id: postId })
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setCount(data.count);
      }
    } catch (e) {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={loading}
      className={`like-button ${isCompact ? 'like-button--sm' : ''} ${liked ? 'is-liked' : ''}`.trim()}
      title={liked ? 'Unlike' : 'Like'}
    >
      <svg
        width={isCompact ? 10 : 12}
        height={isCompact ? 10 : 12}
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <path d="M7 10v12" />
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
      </svg>
      <span>{count}</span>
    </button>
  );
}
