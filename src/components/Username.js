'use client';

import Link from 'next/link';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function Username({
  name,
  force,
  avoidIndex,
  avoidName,
  colorIndex,
  className = '',
  title,
  href,
}) {
  const safeName = String(name || '').trim();
  if (!safeName) return null;

  const idx =
    typeof colorIndex === 'number'
      ? colorIndex
      : getUsernameColorIndex(safeName, { force, avoidIndex, avoidName });

  const classes = ['username', `username--${idx}`, className].filter(Boolean).join(' ');
  
  // Default href to profile page if not provided
  const profileHref = href || `/profile/${encodeURIComponent(safeName)}`;

  return (
    <Link href={profileHref} className={classes} title={title || safeName} style={{ textDecoration: 'none', color: 'inherit' }}>
      {safeName}
    </Link>
  );
}

