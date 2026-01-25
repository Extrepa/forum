'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteConfirmModal from './DeleteConfirmModal';

/** Trash icon (inline SVG) */
function TrashIcon({ size = 14, title = 'Delete' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

/**
 * DeleteCommentButton - Small trash icon in top-right of comment/reply.
 * Shown only for author or admin. Uses confirm modal, then POST to delete API.
 *
 * @param {string} commentId - Comment/reply ID
 * @param {string} parentId - Parent entity ID (post id, log id, project id, etc.)
 * @param {string} type - 'post' | 'devlog' | 'project' | 'forum' | 'music' | 'event' | 'timeline'
 * @param {string|number|null} authorUserId - Author's user ID
 * @param {string|number|null} currentUserId - Logged-in user ID
 * @param {boolean} isAdmin - Whether current user is admin
 * @param {() => void} [onDeleted] - Callback after successful delete (default: router.refresh())
 */
export default function DeleteCommentButton({
  commentId,
  parentId,
  type,
  authorUserId,
  currentUserId,
  isAdmin,
  onDeleted,
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = currentUserId && (String(authorUserId) === String(currentUserId) || isAdmin);
  if (!canDelete) return null;

  const getDeleteUrl = () => {
    switch (type) {
      case 'forum':
        return `/api/forum/${parentId}/replies/${commentId}/delete`;
      case 'project':
        return `/api/projects/${parentId}/replies/${commentId}/delete`;
      case 'devlog':
        return `/api/devlog/${parentId}/comments/${commentId}/delete`;
      case 'post':
        return `/api/posts/${parentId}/comments/${commentId}/delete`;
      case 'music':
        return `/api/music/comments/${commentId}/delete`;
      case 'event':
        return `/api/events/${parentId}/comments/${commentId}/delete`;
      case 'timeline':
        return `/api/timeline/${parentId}/comments/${commentId}/delete`;
      default:
        return null;
    }
  };

  const handleDelete = async () => {
    const url = getDeleteUrl();
    if (!url) {
      alert('Delete not supported for this type');
      setIsDeleting(false);
      setShowModal(false);
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        if (onDeleted) onDeleted();
        else router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (e) {
      alert('Error deleting');
    } finally {
      setIsDeleting(false);
      setShowModal(false);
    }
  };

  const iconSize = 14;
  const baseStyle = {
    position: 'absolute',
    top: 4,
    right: 4,
    width: iconSize,
    height: iconSize,
    minWidth: iconSize,
    minHeight: iconSize,
    padding: 0,
    margin: 0,
    background: 'transparent',
    border: 'none',
    borderRadius: 4,
    color: 'var(--muted)',
    cursor: isDeleting ? 'not-allowed' : 'pointer',
    opacity: isDeleting ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'none',
    transform: 'none',
    transition: 'color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        title="Delete"
        disabled={isDeleting}
        style={baseStyle}
        onMouseEnter={(e) => {
          if (!isDeleting) {
            e.currentTarget.style.color = '#ff6b6b';
            e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.35)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--muted)';
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <TrashIcon size={iconSize} />
      </button>
      <DeleteConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        itemType="reply"
      />
    </>
  );
}
