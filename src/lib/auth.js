import { getDb } from './db';
import { getSessionToken } from './session';

export async function getSessionUser() {
  const token = await getSessionToken();
  if (!token) {
    return null;
  }
  const db = await getDb();
  try {
    // Try with all columns including preferred_username_color_index
    const user = await db
      .prepare(
        'SELECT id, username, role, email, phone, password_hash, must_change_password, notify_email_enabled, notify_sms_enabled, notify_rsvp_enabled, notify_like_enabled, notify_update_enabled, notify_mention_enabled, ui_lore_enabled, default_landing_page, preferred_username_color_index FROM users WHERE session_token = ?'
      )
      .bind(token)
      .first();
    if (user) {
      user.preferred_username_color_index = user.preferred_username_color_index ?? null;
    }
    return user;
  } catch (e) {
    // Fallback: column might not exist yet, try without it
    try {
      const user = await db
        .prepare(
          'SELECT id, username, role, email, phone, password_hash, must_change_password, notify_email_enabled, notify_sms_enabled, ui_lore_enabled, default_landing_page FROM users WHERE session_token = ?'
        )
        .bind(token)
        .first();
      if (user) {
        user.ui_lore_enabled = user.ui_lore_enabled ?? 0;
        user.default_landing_page = user.default_landing_page ?? 'home';
        user.preferred_username_color_index = null;
      }
      return user;
    } catch (e2) {
      // Final fallback: minimal columns
      const user = await db
        .prepare(
          'SELECT id, username, role, email, phone, password_hash, must_change_password, notify_email_enabled, notify_sms_enabled FROM users WHERE session_token = ?'
        )
        .bind(token)
        .first();
      if (user) {
        user.ui_lore_enabled = 0;
        user.default_landing_page = 'home';
        user.preferred_username_color_index = null;
      }
      return user;
    }
  }
}

/**
 * Update the last_seen timestamp for a user
 * This should be called when a user visits a page to track active browsing
 */
export async function updateUserLastSeen(userId) {
  if (!userId) {
    return;
  }
  try {
    const db = await getDb();
    const now = Date.now();
    // Update last_seen, but only if column exists (graceful fallback)
    try {
      await db
        .prepare('UPDATE users SET last_seen = ? WHERE id = ?')
        .bind(now, userId)
        .run();
    } catch (e) {
      // Column might not exist yet if migration hasn't run
      // Silently fail - this is expected during initial setup
    }
  } catch (e) {
    // Database might not be available
    // Silently fail to avoid breaking page loads
  }
}
