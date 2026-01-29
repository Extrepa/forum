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

      // Default to "above and right" of the anchor
      let candidateLeft = anchorRect.right + 4; // 4px offset to the right
      let candidateTop = anchorRect.top - 4 - popoverRect.height; // 4px offset above

      // Prioritize "above and right" if it fits
      if (candidateTop >= 16 && candidateLeft + popoverRect.width <= viewportWidth - 16) {
        newLeft = candidateLeft;
        newTop = candidateTop;
      }
      // If "above and right" doesn't fit, try "below and right"
      else if (anchorRect.bottom + 4 + popoverRect.height <= viewportHeight - 16 && candidateLeft + popoverRect.width <= viewportWidth - 16) {
        newLeft = candidateLeft;
        newTop = anchorRect.bottom + 4;
      }
      // Fallback: Default to "above and right" and let clamping handle it
      else {
        newLeft = candidateLeft;
        newTop = candidateTop;
      }

      // Final clamping for horizontal position
      newLeft = Math.max(16, Math.min(newLeft, viewportWidth - popoverRect.width - 16));

      // Final clamping for vertical position
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
