'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import EditPostButtonWithPanel from './EditPostButtonWithPanel';
import EditPostModal from './EditPostModal';

export default function PostActionMenu({
  buttonLabel = 'Edit Post',
  editModal,
  children,
  rightChildren = null
}) {
  const hasExtras = Boolean(children) || Boolean(rightChildren);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);
  const popoverRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  useEffect(() => {
    if (!hasExtras || !menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setMenuOpen(false);
        setHovering(false);
        clearCloseTimer();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [hasExtras, menuOpen]);

  const showMenu = hasExtras && (menuOpen || hovering);

  useEffect(() => {
    if (!showMenu || typeof window === 'undefined') return undefined;

    const updatePosition = () => {
      if (!containerRef.current || !popoverRef.current) return;
      const anchorRect = containerRef.current.getBoundingClientRect();
      const panelRect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const edgePadding = 12;
      const gap = 10;

      const panelWidth = Math.max(180, panelRect.width || 180);
      const panelHeight = Math.max(40, panelRect.height || 40);

      let left = anchorRect.left - panelWidth - gap;
      if (left < edgePadding) {
        left = anchorRect.right + gap;
      }
      left = Math.max(edgePadding, Math.min(left, viewportWidth - panelWidth - edgePadding));

      let top = anchorRect.top + (anchorRect.height / 2) - (panelHeight / 2);
      top = Math.max(edgePadding, Math.min(top, viewportHeight - panelHeight - edgePadding));

      if (viewportWidth <= 640) {
        left = Math.max(edgePadding, Math.min(anchorRect.right - panelWidth, viewportWidth - panelWidth - edgePadding));
        top = Math.min(anchorRect.bottom + gap, viewportHeight - panelHeight - edgePadding);
      }

      setPopoverStyle({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        right: 'auto',
        transform: 'none',
        maxWidth: `${Math.max(160, viewportWidth - (edgePadding * 2))}px`,
        zIndex: 4000,
      });
    };

    const timerId = setTimeout(updatePosition, 0);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      clearTimeout(timerId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showMenu]);

  const handlePointerEnter = () => {
    if (!hasExtras) return;
    clearCloseTimer();
    setHovering(true);
  };

  const handlePointerLeave = () => {
    if (!hasExtras) return;
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setHovering(false);
    }, 300);
  };

  const handleClick = () => {
    if (!hasExtras) return;
    setMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        clearCloseTimer();
        setHovering(true);
      }
      return next;
    });
  };

  const handleBlur = (event) => {
    if (!hasExtras || !containerRef.current) {
      return;
    }
    const relatedTarget = event.relatedTarget;
    if (!relatedTarget || !containerRef.current.contains(relatedTarget)) {
      setHovering(false);
    }
  };

  const containerClass = showMenu ? 'post-action-menu post-action-menu--active' : 'post-action-menu';
  const popover = showMenu ? (
    <div
      ref={popoverRef}
      className="post-action-menu__popover"
      style={popoverStyle}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
    >
      <div className="post-action-menu__left">
        {children}
      </div>
      {rightChildren ? (
        <div className="post-action-menu__right">{rightChildren}</div>
      ) : null}
    </div>
  ) : null;

  return (
    <div
      className={containerClass}
      ref={containerRef}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onClick={handleClick}
      onFocus={handlePointerEnter}
      onBlur={handleBlur}
    >
      <EditPostButtonWithPanel 
        buttonLabel={buttonLabel} 
        onOpen={() => setIsEditModalOpen(true)} 
      />
      {mounted && popover ? createPortal(popover, document.body) : null}
      {editModal && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          {editModal}
        </EditPostModal>
      )}
    </div>
  );
}
