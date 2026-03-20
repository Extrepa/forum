/**
 * Admin notification event keys for "post manipulation" and user-related alerts.
 * Used by account settings UI and (when implemented) by notification sending.
 */
export const ADMIN_EVENT_KEYS = [
  { key: 'post_deleted', label: 'Post/content deleted' },
  { key: 'content_edited', label: 'Post/content edited' },
  { key: 'content_hidden', label: 'Post/content hidden' },
  { key: 'content_locked', label: 'Post/content locked' },
  { key: 'content_moved', label: 'Post/content moved' },
  { key: 'content_pinned', label: 'Post/content pinned' },
  { key: 'content_restored', label: 'Post/content restored' },
  { key: 'user_deleted', label: 'User deleted' },
  { key: 'user_restored', label: 'User restored' },
  { key: 'user_role_changed', label: 'User role changed' }
];

export const ALL_ADMIN_EVENT_KEYS = ADMIN_EVENT_KEYS.map((o) => o.key);

export function parseAdminEventsJson(value) {
  if (value == null || value === '') {
    return {};
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function defaultAdminEvents() {
  return Object.fromEntries(ALL_ADMIN_EVENT_KEYS.map((k) => [k, false]));
}
