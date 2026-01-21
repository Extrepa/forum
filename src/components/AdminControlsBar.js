'use client';

import EditPostButton from './EditPostButton';
import DeletePostButton from './DeletePostButton';

export default function AdminControlsBar({ 
  postId, 
  postType = 'thread', 
  replyId = null,
  canEdit = false,
  canDelete = false,
  canLock = false,
  isLocked = false,
  onEdit,
  onDeleted,
  onLockToggle
}) {
  if (!canEdit && !canDelete && !canLock) {
    return null;
  }

  return (
    <div 
      className="admin-controls-bar"
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        padding: '8px 12px',
        marginBottom: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        background: 'rgba(0, 0, 0, 0.2)'
      }}
    >
      {canEdit && (
        <EditPostButton 
          postId={postId} 
          postType={postType} 
          replyId={replyId}
          onEdit={onEdit}
        />
      )}
      {canDelete && (
        <DeletePostButton 
          postId={postId} 
          postType={postType} 
          replyId={replyId}
          onDeleted={onDeleted}
        />
      )}
      {canLock && (
        <button
          type="button"
          onClick={onLockToggle}
          className="button"
          style={{ 
            fontSize: '12px', 
            padding: '4px 8px'
          }}
          title={isLocked ? 'Unlock thread' : 'Lock thread'}
        >
          {isLocked ? 'Unlock' : 'Lock'}
        </button>
      )}
    </div>
  );
}
