import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAvatarUrl } from '../lib/media';
import { createPortal } from 'react-dom';

export default function UserPopover({ username, onClose, anchorRef }) {
  const popoverRef = useRef(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(0); // Initialize with 0
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize(); // Set initial width
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data fetching useEffect (kept as is)
  useEffect(() => {
    console.log('UserPopover: Fetching data for username:', username); // Debugging line
    fetch(`/api/user/${encodeURIComponent(username)}`)
      .then(res => {
        if (!res.ok) {
          console.error('UserPopover: API response not OK:', res.status, res.statusText); // Debugging line
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('UserPopover: Received user data:', data); // Debugging line
        if (!data.error) {
          setUserInfo(data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('UserPopover: Error during data fetch:', error); // Debugging line
        setLoading(false);
      });
  }, [username]);

  useEffect(() => {
    const calculatePosition = () => {
      if (!anchorRef.current || !popoverRef.current) return;

      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let newLeft, newTop;

      // Default to "above and to the right" for desktop
      if (viewportWidth > 640) {
        newLeft = anchorRect.right + 4; // 4px to the right of the anchor
        newTop = anchorRect.top - 4 - popoverRect.height; // 4px above the anchor

        // Fallback to "below and to the right" if not enough space above
        if (newTop < 16) { // 16px from top edge
          newTop = anchorRect.bottom + 4; // 4px below the anchor
        }

        // Clamp to viewport edges
        newLeft = Math.max(16, Math.min(newLeft, viewportWidth - popoverRect.width - 16));
        newTop = Math.max(16, Math.min(newTop, viewportHeight - popoverRect.height - 16));

      } else { // Mobile (viewportWidth <= 640) - centered horizontally, prioritize below
        newLeft = anchorRect.left + (anchorRect.width / 2) - (popoverRect.width / 2);
        newTop = anchorRect.bottom + 4; // Default to below with a small offset

        // Clamp horizontally first
        newLeft = Math.max(16, Math.min(newLeft, viewportWidth - popoverRect.width - 16));

        // If it goes off-screen below, try above
        if (newTop + popoverRect.height > viewportHeight - 16 && anchorRect.top - 4 - popoverRect.height >= 16) {
          newTop = anchorRect.top - 4 - popoverRect.height;
        }

        // Final vertical clamping
        newTop = Math.max(16, Math.min(newTop, viewportHeight - popoverRect.height - 16));
      }

      setPopoverPosition({ top: newTop, left: newLeft });
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [username, anchorRef, viewportWidth, loading]); // Depend on relevant states/props


  const avatarUrl = getAvatarUrl(userInfo?.avatar_key);
  const profileHref = `/profile/${encodeURIComponent(username)}`;

  return createPortal(
    <div
      ref={popoverRef}
      className="card notifications-popover-errl"
      style={{
        position: 'fixed',
        zIndex: 9999,
        top: popoverPosition.top,
        left: popoverPosition.left,
        width: viewportWidth <= 640 ? 'fit-content' : 'max-content',
        minWidth: viewportWidth <= 640 ? '120px' : undefined,
        maxWidth: 'calc(100vw - 32px)',
        padding: '12px',
        background: 'var(--errl-panel)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        backdropFilter: 'blur(10px)',
        animation: 'popoverIn 0.2s ease-out'
      }}
      onMouseEnter={() => {}} // Keep open on hover over popover
      onMouseLeave={onClose} // Close when mouse leaves popover
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
        <div style={{ position: 'relative', width: '64px', height: '64px', maxWidth: '100%', flexShrink: 1, minWidth: 0 }}>
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

      <div style={{ textAlign: 'center', wordBreak: 'break-word', maxWidth: '100%', flexShrink: 1, minWidth: 0 }}>
        {console.log('UserPopover: UserInfo for color debug:', userInfo)}
        <div style={{ fontSize: '14px', fontWeight: '700', color: userInfo ? `var(--username-${userInfo.preferred_username_color_index || 0})` : 'var(--muted)', wordBreak: 'break-word', maxWidth: '100%', flexShrink: 1, minWidth: 0 }}>
          {username}
        </div>
        {userInfo?.role && (
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', marginBottom: '4px', wordBreak: 'break-word', maxWidth: '100%', flexShrink: 1, minWidth: 0 }}>
            {userInfo.role === 'admin' ? 'Admin' : userInfo.role === 'mod' ? 'Mod' : 'Resident'}
          </div>
        )}
        <Link
          href={profileHref}
          onClick={onClose} // Close popover when clicking link
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
    </div>,
    document.body
  );
}