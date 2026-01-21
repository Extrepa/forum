'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function DeletePostButton({ postId, postType = 'thread', replyId = null, onDeleted }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const url = replyId 
        ? `/api/forum/${postId}/replies/${replyId}/delete`
        : `/api/forum/${postId}/delete`;
      
      const response = await fetch(url, { method: 'POST' });
      
      if (response.ok) {
        if (onDeleted) {
          onDeleted();
        } else {
          // Redirect or reload
          if (replyId) {
            // Stay on same page, just reload
            router.refresh();
          } else {
            // Redirect to lobby if thread deleted
            router.push('/lobby');
          }
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (e) {
      alert('Error deleting post');
    } finally {
      setIsDeleting(false);
      setShowModal(false);
    }
  };

  const itemType = replyId ? 'reply' : postType === 'thread' ? 'thread' : 'post';

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="button"
        style={{ 
          fontSize: '12px', 
          padding: '4px 8px',
          background: 'rgba(255, 52, 52, 0.1)',
          borderColor: 'rgba(255, 52, 52, 0.3)',
          color: '#ff6b6b'
        }}
        title="Delete post"
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
      <DeleteConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        itemType={itemType}
      />
    </>
  );
}
