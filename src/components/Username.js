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
  href = '/account',
}) {
  const safeName = String(name || '').trim();
  if (!safeName) return null;

  const idx =
    typeof colorIndex === 'number'
      ? colorIndex
      : getUsernameColorIndex(safeName, { force, avoidIndex, avoidName });

  const classes = ['username', `username--${idx}`, className].filter(Boolean).join(' ');

  return (
    <Link href={href} className={classes} title={title || safeName} style={{ textDecoration: 'none', color: 'inherit' }}>
      {safeName}
    </Link>
  );
}

