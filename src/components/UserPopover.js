'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAvatarUrl } from '../lib/media';

export default function UserPopover({ username, avatarKey, colorIndex, onClose, anchorRef }) {
  const popoverRef = useRef(null);
  const [userInfo, setUserInfo] = useState(avatarKey ? { username, avatar_key: avatarKey } : null);
  const [loading, setLoading] = useState(!avatarKey);

  useEffect(() => {
    if (!avatarKey) {
      fetch(`/api/user/${encodeURIComponent(username)}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setUserInfo(data);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [username, avatarKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target) && 
          anchorRef.current && !anchorRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  const avatarUrl = getAvatarUrl(userInfo?.avatar_key);
  const profileHref = `/profile/${encodeURIComponent(username)}`;

  return (
    <div 
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: '0',
        zIndex: 1000,
        width: '140px',
        padding: '12px',
        background: 'var(--errl-panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
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
              border: `2px solid var(--username-${colorIndex || 0})`,
              background: 'rgba(0,0,0,0.3)'
            }}
          />
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: `var(--username-${colorIndex || 0})` }}>
          {username}
        </div>
        <Link 
          href={profileHref}
          onClick={onClose}
          style={{ 
            fontSize: '11px', 
            color: 'var(--accent)', 
            marginTop: '4px', 
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
