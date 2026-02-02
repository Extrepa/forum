'use client';

import { useState, useRef, useEffect } from 'react';
import AvatarImage from './AvatarImage';
import { getUsernameColorIndex } from '../lib/usernameColor';
import { getAvatarUrl } from '../lib/media';
import UserPopover from './UserPopover';

export default function Username({
  name,
  force,
  avoidIndex,
  avoidName,
  colorIndex,
  preferredColorIndex,
  className = '',
  title,
  href,
  avatarKey,
  style,
}) {
  const [showPopover, setShowPopover] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [isTouch, setIsTouch] = useState(false);
  const anchorRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsTouch(window.matchMedia('(hover: none)').matches);
  }, []);

  const safeName = String(name || '').trim();
  if (!safeName) return null;

  let idx =
    typeof colorIndex === 'number'
      ? colorIndex
      : getUsernameColorIndex(safeName, { force, avoidIndex, avoidName, preferredColorIndex });

  // Ensure idx is always a valid number between 0-7
  if (typeof idx !== 'number' || idx < 0 || idx > 7) {
    idx = getUsernameColorIndex(safeName, { force, avoidIndex, avoidName, preferredColorIndex });
  }
  // Clamp to valid range
  idx = Math.max(0, Math.min(7, Math.floor(idx)));

  const classes = ['username', `username--${idx}`, className].filter(Boolean).join(' ');

  const avatarUrl = getAvatarUrl(avatarKey);

  const disableLink = href === null || href === false;

  const cancelHoverTimeout = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const openPopover = () => {
    cancelHoverTimeout();
    setShowPopover(true);
  };

  const schedulePopoverClose = () => {
    cancelHoverTimeout();
    const timeout = setTimeout(() => {
      setShowPopover(false);
      setHoverTimeout(null);
    }, 200); // 200ms delay to allow moving to popover
    setHoverTimeout(timeout);
  };

  const handleClick = () => {
    if (!isTouch) return;
    cancelHoverTimeout();
    setShowPopover(prev => !prev);
  };

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', width: 'fit-content', maxWidth: '100%' }}
    >
      <span
        ref={anchorRef}
        className={classes}
        title={title || safeName}
        style={{ ...style, cursor: disableLink ? 'default' : 'pointer' }}
        onMouseEnter={openPopover}
        onMouseLeave={schedulePopoverClose}
        onClick={handleClick}
      >
        {avatarUrl && (
          <AvatarImage
            src={avatarUrl}
            alt={`${safeName}'s avatar`}
            size={24}
            className="username-avatar"
            loading="lazy"
          />
        )}
        <span>{safeName}</span>
      </span>

      {showPopover && (
        <UserPopover 
          username={safeName} 
          avatarKey={avatarKey} 
          onClose={() => setShowPopover(false)}
          anchorRef={anchorRef}
          onPopoverMouseEnter={openPopover}
          onPopoverMouseLeave={schedulePopoverClose}
        />
      )}
    </span>
  );
}
