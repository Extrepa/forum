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
      let url;
      if (replyId) {
        // Reply/comment deletion
        if (postType === 'thread') {
          url = `/api/forum/${postId}/replies/${replyId}/delete`;
        } else if (postType === 'project') {
          url = `/api/projects/${postId}/replies/${replyId}/delete`;
        } else if (postType === 'devlog') {
          url = `/api/devlog/${postId}/comments/${replyId}/delete`;
        } else {
          // For now, only forum threads support reply deletion
          alert('Delete not yet implemented for this post type');
          setIsDeleting(false);
          setShowModal(false);
          return;
        }
      } else {
        // Post deletion
        if (postType === 'thread') {
          url = `/api/forum/${postId}/delete`;
        } else if (postType === 'project') {
          url = `/api/projects/${postId}/delete`;
        } else if (postType === 'event') {
          url = `/api/events/${postId}/delete`;
        } else if (postType === 'music') {
          url = `/api/music/${postId}/delete`;
        } else if (postType === 'devlog') {
          url = `/api/devlog/${postId}/delete`;
        } else if (postType === 'post') {
          url = `/api/posts/${postId}/delete`;
        } else if (postType === 'timeline') {
          url = `/api/timeline/${postId}/delete`;
        } else {
          alert('Delete not yet implemented for this post type');
          setIsDeleting(false);
          setShowModal(false);
          return;
        }
      }
      
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
            // Redirect based on post type
            if (postType === 'thread') {
              router.push('/lobby');
            } else if (postType === 'project') {
              router.push('/projects');
            } else if (postType === 'event') {
              router.push('/events');
            } else if (postType === 'music') {
              router.push('/music');
            } else if (postType === 'devlog') {
              router.push('/devlog');
            } else if (postType === 'post') {
              // For posts, redirect to lore-memories (covers lore, memories, and other post types)
              router.push('/lore-memories');
            } else if (postType === 'timeline') {
              router.push('/announcements');
            } else {
              router.refresh();
            }
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
