'use client';

/* eslint-disable @next/next/no-img-element */

import { getAvatarUrl } from '../lib/media';

export default function AvatarImage({
  avatarKey,
  src,
  alt = '',
  size,
  width,
  height,
  className = '',
  style = {},
  decoding = 'async',
  draggable = false,
  ...rest
}) {
  const resolvedSrc = src || (avatarKey ? getAvatarUrl(avatarKey) : null);
  if (!resolvedSrc) return null;

  const numericSize = size ? Number(size) : undefined;
  const dimensionProps = {};

  if (numericSize) {
    dimensionProps.width = numericSize;
    dimensionProps.height = numericSize;
  } else {
    if (width) dimensionProps.width = width;
    if (height) dimensionProps.height = height;
  }

  const mergedStyle = { ...style };
  if (numericSize && !mergedStyle.width) mergedStyle.width = `${numericSize}px`;
  if (numericSize && !mergedStyle.height) mergedStyle.height = `${numericSize}px`;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      decoding={decoding}
      draggable={draggable}
      className={className}
      style={mergedStyle}
      {...dimensionProps}
      {...rest}
    />
  );
}
