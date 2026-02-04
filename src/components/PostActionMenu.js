'use client';

import { useEffect, useRef, useState } from 'react';
import EditPostButtonWithPanel from './EditPostButtonWithPanel';

export default function PostActionMenu({
  buttonLabel = 'Edit Post',
  panelId,
  children,
  rightChildren = null
}) {
  const hasExtras = Boolean(children) || Boolean(rightChildren);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const containerRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
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
      <EditPostButtonWithPanel buttonLabel={buttonLabel} panelId={panelId} />
      {showMenu && (
        <div
          className="post-action-menu__popover"
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
      )}
    </div>
  );
}
