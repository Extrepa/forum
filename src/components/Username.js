'use client';

import Link from 'next/link';
import { getUsernameColorIndex } from '../lib/usernameColor';

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
}) {
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

  const avatarUrl = avatarKey ? `/api/media/avatars/${avatarKey.split('/').pop()}` : null;

  return (
    <Link href={profileHref} className={classes} title={title || safeName} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {avatarUrl && (
        <img 
          src={avatarUrl} 
          alt="" 
          className="username-avatar"
          style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            border: '1px solid var(--accent)',
            background: '#000',
            flexShrink: 0
          }} 
        />
      )}
      <span>{safeName}</span>
    </Link>
  );
}

