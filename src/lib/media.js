export function getAvatarUrl(avatarKey) {
  if (avatarKey === undefined) return null;
  if (!avatarKey) return '/icons/default-avatar.svg';
  // Get just the filename if it's a path
  const filename = avatarKey.split('/').pop();
  return `/api/media/avatars/${filename}`;
}
