'use client';

export default function EditPostButton({ postId, postType = 'thread', replyId = null, onEdit }) {
  const handleClick = () => {
    if (onEdit) {
      onEdit();
    } else {
      // Default behavior: navigate to edit mode
      const url = new URL(window.location.href);
      url.searchParams.set('edit', 'true');
      window.location.href = url.toString();
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
