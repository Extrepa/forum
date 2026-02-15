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
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    return { width: window.innerWidth, height: window.innerHeight };
  });

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
    if (typeof window === 'undefined') return undefined;
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen || !mounted) return null;

  const isMobile = viewport.width > 0 && viewport.width <= 640;
  const isShortViewport = viewport.height > 0 && viewport.height <= 560;
  const resolvedMaxWidth = maxWidth || (variant === 'wide' ? '900px' : '600px');
  const resolvedMaxHeight = maxHeight || '90vh';
  const overlayPaddingX = isMobile ? 12 : 20;
  const overlayPaddingY = isShortViewport ? 10 : overlayPaddingX;
  const overlayAlign = isMobile ? 'flex-start' : 'center';
  const contentMaxWidth = isMobile
    ? 'min(calc(100vw - 24px), 420px)'
    : `min(${resolvedMaxWidth}, calc(100vw - 40px))`;
  const contentMaxHeight = isMobile
    ? `min(85vh, calc(100dvh - ${overlayPaddingY * 2}px))`
    : `min(${resolvedMaxHeight}, calc(100dvh - ${overlayPaddingY * 2}px))`;

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
        padding: `${overlayPaddingY}px ${overlayPaddingX}px`,
        overflowY: 'auto',
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
          width: '100%',
          margin: '0 auto',
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
