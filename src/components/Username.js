'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  
  // Default href to profile page if not provided
  const profileHref = href || `/profile/${encodeURIComponent(safeName)}`;

  const avatarUrl = getAvatarUrl(avatarKey);

  const disableLink = href === null || href === false;

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setShowPopover(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowPopover(false);
    }, 200); // 200ms delay to allow moving to popover
    setHoverTimeout(timeout);
  };

  const handleClick = () => {
    if (!isTouch) return;
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setShowPopover(prev => !prev);
  };

  return (
    <span 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <span 
        ref={anchorRef}
        className={classes} 
        title={title || safeName} 
        style={{ ...style, cursor: disableLink ? 'default' : 'pointer' }}
      >
        {avatarUrl && (
          <Image 
            src={avatarUrl} 
            alt="" 
            className="username-avatar"
            width={24}
            height={24}
            unoptimized
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
        />
      )}
    </span>
  );
}
