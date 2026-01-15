import { getCloudflareContext } from '@opennextjs/cloudflare';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function getUploadsBucket() {
  const ctx = await getCloudflareContext({ async: true });
  const bucket = ctx?.env?.UPLOADS;
  if (!bucket) {
    throw new Error('R2 binding "UPLOADS" is not available. Check wrangler.toml.');
  }
  return bucket;
}

export function isAllowedImage(file) {
  if (!file) {
    return { ok: true };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, reason: 'too_large' };
  }
  if (!file.type || !file.type.startsWith('image/')) {
    return { ok: false, reason: 'invalid_type' };
  }
  return { ok: true };
}

export function canUploadImages(user, env) {
  const allowlist = String(env?.IMAGE_UPLOAD_ALLOWLIST || '').trim();
  if (!user) {
    return false;
  }
  if (!allowlist) {
    return false;
  }
  if (allowlist === '*') {
    return true;
  }
  const allowed = allowlist
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(user.username.toLowerCase());
}

export function buildImageKey(prefix, fileName) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${prefix}/${crypto.randomUUID()}-${safeName}`;
}
