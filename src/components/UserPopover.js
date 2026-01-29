import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAvatarUrl } from '../lib/media';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { createPortal } from 'react-dom';

export default function UserPopover({ username, onClose, anchorRef }) {
  const popoverRef = useRef(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(0); // Initialize with 0

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize(); // Set initial width
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Re-inserting the data fetching useEffect
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


  const placement = viewportWidth <= 640 ? 'bottom' : 'top-end'; // Default to 'bottom' on small screens

  const { refs, floatingStyles } = useFloating({
    placement,
    middleware: [
      offset(4), // 4px offset from the anchor
      flip(),    // Flips to other sides if top-end doesn't fit
      shift({ padding: 16 }), // Add padding to shift to keep it 16px from edges
    ],
    elements: {
      reference: anchorRef.current,
    },
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    const handleDocumentClick = (event) => {
      // Ensure refs are current before checking contains
      if (popoverRef.current && anchorRef.current &&
          !popoverRef.current.contains(event.target) &&
          !anchorRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [onClose, anchorRef, popoverRef]);


  const avatarUrl = getAvatarUrl(userInfo?.avatar_key);
  const profileHref = `/profile/${encodeURIComponent(username)}`;

  return createPortal( // Wrap with createPortal
    <div
      ref={refs.setFloating} // Assign Floating UI's floating ref
      className="card notifications-popover-errl" // Apply Errl border styling class
      style={{
        ...floatingStyles, // Apply Floating UI's calculated styles
        position: 'fixed', // Keep as fixed for viewport positioning
        zIndex: 9999,
        width: 'max-content',
        maxWidth: 'calc(100vw - 32px)', // Re-introduce responsive max-width
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
    </div>,
    document.body
  );
}