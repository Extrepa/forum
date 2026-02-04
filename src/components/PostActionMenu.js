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

  useEffect(() => {
    if (!hasExtras || !menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [hasExtras, menuOpen]);

  const showMenu = hasExtras && (menuOpen || hovering);

  const handlePointerEnter = () => {
    if (hasExtras) {
      setHovering(true);
    }
  };

  const handlePointerLeave = () => {
    if (hasExtras) {
      setHovering(false);
    }
  };

  const handleClick = () => {
    if (hasExtras) {
      setMenuOpen(true);
    }
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

  return (
    <div
      className="post-action-menu"
      ref={containerRef}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onClick={handleClick}
      onFocus={handlePointerEnter}
      onBlur={handleBlur}
    >
      <EditPostButtonWithPanel buttonLabel={buttonLabel} panelId={panelId} />
      {showMenu && (
        <div className="post-action-menu__popover">
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
