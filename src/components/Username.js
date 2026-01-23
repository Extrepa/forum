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

  return (
    <Link href={profileHref} className={classes} title={title || safeName} style={{ textDecoration: 'none' }}>
      {safeName}
    </Link>
  );
}

