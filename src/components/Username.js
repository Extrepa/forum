'use client';

import { getUsernameColorIndex } from '../lib/usernameColor';

export default function Username({
  name,
  force,
  avoidIndex,
  avoidName,
  colorIndex,
  className = '',
  title,
}) {
  const safeName = String(name || '').trim();
  if (!safeName) return null;

  const idx =
    typeof colorIndex === 'number'
      ? colorIndex
      : getUsernameColorIndex(safeName, { force, avoidIndex, avoidName });

  const classes = ['username', `username--${idx}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes} title={title || safeName}>
      {safeName}
    </span>
  );
}

