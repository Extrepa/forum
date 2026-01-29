'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAvatarUrl } from '../lib/media';

export default function UserPopover({ username, onClose, anchorRef }) {
  const popoverRef = useRef(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popoverPosition, setPopoverPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    fetch(`/api/user/${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setUserInfo(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!anchorRef.current || !popoverRef.current) return;

    const calculatePosition = () => {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newLeft, newTop;

      // Calculate a default horizontal position centered with the anchor
      const centeredLeft = anchorRect.left + (anchorRect.width / 2) - (popoverRect.width / 2);

      // Try positioning below the anchor
      if (anchorRect.bottom + 8 + popoverRect.height <= viewportHeight - 16) {
        newTop = anchorRect.bottom + 8;
      }
      // Try positioning above the anchor
      else if (anchorRect.top - 8 - popoverRect.height >= 16) {
        newTop = anchorRect.top - 8 - popoverRect.height;
      }
      // Default to below if neither fits perfectly, clamping will adjust
      else {
        newTop = anchorRect.bottom + 8;
      }

      newLeft = centeredLeft;

      // Final clamping for horizontal position
      newLeft = Math.max(16, Math.min(newLeft, viewportWidth - popoverRect.width - 16));

      // Final clamping for vertical position
      // Ensure at least 16px from top edge and bottom edge
      newTop = Math.max(16, Math.min(newTop, viewportHeight - popoverRect.height - 16));

      setPopoverPosition({ left: newLeft, top: newTop });
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [anchorRef, onClose, popoverRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target) &&
          anchorRef.current && !anchorRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, anchorRef, popoverRef]);

  const avatarUrl = getAvatarUrl(userInfo?.avatar_key);
  const profileHref = `/profile/${encodeURIComponent(username)}`;

  return (
    <div 
      ref={popoverRef}
      className="card notifications-popover-errl" // Apply Errl border styling class
      style={{
        position: 'fixed',
        top: popoverPosition.top,
        left: popoverPosition.left,
        zIndex: 9999,
        width: 'max-content',
        maxWidth: 'calc(100vw - 32px)', // Ensures it doesn't overflow on small screens
        padding: '12px',
        background: 'var(--errl-panel)',
        // Removed explicit border, borderRadius, boxShadow since .card class handles it
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        backdropFilter: 'blur(10px)',
        animation: 'popoverIn 0.2s ease-out'
      }}
    >
      <style>{`
        @keyframes popoverIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {loading ? (
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', animate: 'pulse 1.5s infinite' }} />
      ) : (
        <div style={{ position: 'relative', width: '64px', height: '64px' }}>
          <Image
            src={avatarUrl}
            alt={username}
            width={64}
            height={64}
            unoptimized
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: `2px solid var(--username-${userInfo?.preferred_username_color_index || 0})`,
              background: 'rgba(0,0,0,0.3)'
            }}
          />
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: `var(--username-${userInfo?.preferred_username_color_index || 0})` }}>
          {username}
        </div>
        {userInfo?.role && (
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', marginBottom: '4px' }}>
            {userInfo.role === 'admin' ? 'Admin' : userInfo.role === 'mod' ? 'Mod' : 'Resident'}
          </div>
        )}
        <Link 
          href={profileHref}
          onClick={onClose}
          style={{ 
            fontSize: '11px', 
            color: 'var(--accent)', 
            marginTop: userInfo?.role ? '0px' : '4px', 
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}
        >
          View Profile →
        </Link>
      </div>
    </div>
  );
}
