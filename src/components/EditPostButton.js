'use client';

import { useState } from 'react';

export default function EditPostButton({ postId, postType = 'thread', replyId = null, onEdit }) {
  const handleClick = () => {
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="button"
      style={{ fontSize: '12px', padding: '4px 8px' }}
      title="Edit post"
    >
      Edit
    </button>
  );
}
