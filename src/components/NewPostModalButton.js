'use client';

import { useState } from 'react';
import CreatePostModal from './CreatePostModal';

export default function NewPostModalButton({
  label = 'New Post',
  title = 'New Post',
  disabled = false,
  variant = 'default',
  maxWidth,
  maxHeight,
  children
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={disabled}>
        {label}
      </button>
      <CreatePostModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={title}
        variant={variant}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
      >
        {children}
      </CreatePostModal>
    </>
  );
}

