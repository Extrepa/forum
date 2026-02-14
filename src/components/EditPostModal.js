'use client';

import CreatePostModal from './CreatePostModal';

export default function EditPostModal({ 
  isOpen, 
  onClose, 
  title = "Edit Post",
  children
}) {
  return (
    <CreatePostModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="wide"
    >
      {children}
    </CreatePostModal>
  );
}
