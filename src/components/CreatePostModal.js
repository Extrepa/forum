'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function CreatePostModal({
  isOpen,
  onClose,
  children,
  title,
  className = '',
  variant = 'default', // default | wide
  maxWidth,
  maxHeight
}) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 640);

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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, []);

  if (!isOpen || !mounted) return null;

  const resolvedMaxWidth = maxWidth || (variant === 'wide' ? '900px' : '600px');
  const resolvedMaxHeight = maxHeight || '90vh';
  const overlayPadding = isMobile ? '12px' : '20px';
  const overlayAlign = isMobile ? 'center' : 'center';
  const contentMaxWidth = isMobile ? 'min(calc(100% - 40px), 420px)' : resolvedMaxWidth;
  const contentMaxHeight = isMobile ? 'min(85vh, calc(100vh - 44px))' : resolvedMaxHeight;

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
        alignItems: overlayAlign,
        justifyContent: 'center',
        zIndex: 12000,
        padding: overlayPadding,
      }}
    >
      <div
        className={`modal-content ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius)',
          padding: isMobile ? '18px' : '24px',
          maxWidth: contentMaxWidth,
          
          margin: 'auto',
          maxHeight: contentMaxHeight,
          overflowX: 'hidden',
          overflowY: 'auto',
          boxShadow: 'var(--shadow)',
          boxSizing: 'border-box',
          position: 'relative',
          isolation: 'isolate',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
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
