'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function CreatePostModal({
  isOpen,
  onClose,
  children,
  title,
  variant = 'default', // default | wide
  maxWidth,
  maxHeight
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const resolvedMaxWidth = maxWidth || (variant === 'wide' ? '900px' : '600px');
  const resolvedMaxHeight = maxHeight || '90vh';

  const modal = (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 12000,
        padding: '20px',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          maxWidth: resolvedMaxWidth,
          width: '100%',
          maxHeight: resolvedMaxHeight,
          overflow: 'auto',
          boxShadow: 'var(--shadow)',
          boxSizing: 'border-box',
          position: 'relative',
          isolation: 'isolate',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          {title && <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
