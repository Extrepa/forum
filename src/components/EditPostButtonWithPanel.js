'use client';

export default function EditPostButtonWithPanel({ buttonLabel = 'Edit Post', onOpen }) {
  const compactStyle = {
    fontSize: '13px',
    padding: '7px 12px',
    minWidth: '92px',
    minHeight: '40px',
    lineHeight: 1.2,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  };

  return (
    <button type="button" className="button post-action-menu__trigger" onClick={onOpen} style={compactStyle}>
      {buttonLabel}
    </button>
  );
}
