'use client';

import { useEffect, useRef } from 'react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemType = 'post' }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="section-title" style={{ marginTop: 0 }}>Delete {itemType}?</h3>
        <p style={{ marginBottom: '20px', color: 'var(--muted)' }}>
          Are you sure you want to delete this {itemType}? This will hide it from view in the goo. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="button"
            style={{ background: 'rgba(2, 7, 10, 0.6)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="button"
            style={{
              background: 'rgba(255, 52, 52, 0.2)',
              borderColor: 'rgba(255, 52, 52, 0.5)',
              color: '#ff6b6b'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
