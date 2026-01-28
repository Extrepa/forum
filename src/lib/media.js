export function getAvatarUrl(avatarKey) {
  if (!avatarKey) return null;
  // Get just the filename if it's a path
  const filename = avatarKey.split('/').pop();
  return `/api/media/avatars/${filename}`;
}
