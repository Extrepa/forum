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
        'SELECT id, username, role, email, phone, password_hash, must_change_password, notify_email_enabled, notify_sms_enabled, notify_rsvp_enabled, notify_like_enabled, notify_update_enabled, notify_mention_enabled, notify_reply_enabled, notify_comment_enabled, notify_admin_new_user_enabled, notify_admin_new_post_enabled, ui_lore_enabled, ui_color_mode, ui_border_color, ui_invert_colors, default_landing_page, preferred_username_color_index, avatar_key, avatar_state FROM users WHERE session_token = ?'
      )
      .bind(token)
      .first();
    if (user) {
      user.preferred_username_color_index = user.preferred_username_color_index ?? null;
      user.notify_admin_new_user_enabled = user.notify_admin_new_user_enabled ?? 0;
      user.notify_admin_new_post_enabled = user.notify_admin_new_post_enabled ?? 0;
      return user;
    }
    try {
      const adminUser = await db
        .prepare(
          'SELECT users.id, users.username, users.role, users.email, users.phone, users.password_hash, users.must_change_password, users.notify_email_enabled, users.notify_sms_enabled, users.notify_rsvp_enabled, users.notify_like_enabled, users.notify_update_enabled, users.notify_mention_enabled, users.notify_reply_enabled, users.notify_comment_enabled, users.notify_admin_new_user_enabled, users.notify_admin_new_post_enabled, users.ui_lore_enabled, users.ui_color_mode, users.ui_border_color, users.ui_invert_colors, users.default_landing_page, users.preferred_username_color_index, users.avatar_key, users.avatar_state FROM admin_sessions JOIN users ON users.id = admin_sessions.user_id WHERE admin_sessions.token = ?'
        )
        .bind(token)
        .first();
      if (adminUser) {
        adminUser.preferred_username_color_index = adminUser.preferred_username_color_index ?? null;
        adminUser.notify_admin_new_user_enabled = adminUser.notify_admin_new_user_enabled ?? 0;
        adminUser.notify_admin_new_post_enabled = adminUser.notify_admin_new_post_enabled ?? 0;
      }
      return adminUser;
    } catch (e2) {
      return null;
    }
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
        user.notify_admin_new_user_enabled = 0;
        user.notify_admin_new_post_enabled = 0;
        return user;
      }
      try {
        const adminUser = await db
          .prepare(
            'SELECT users.id, users.username, users.role, users.email, users.phone, users.password_hash, users.must_change_password, users.notify_email_enabled, users.notify_sms_enabled, users.ui_lore_enabled, users.default_landing_page FROM admin_sessions JOIN users ON users.id = admin_sessions.user_id WHERE admin_sessions.token = ?'
          )
          .bind(token)
          .first();
        if (adminUser) {
          adminUser.ui_lore_enabled = adminUser.ui_lore_enabled ?? 0;
          adminUser.default_landing_page = adminUser.default_landing_page ?? 'home';
          adminUser.preferred_username_color_index = null;
          adminUser.notify_admin_new_user_enabled = 0;
          adminUser.notify_admin_new_post_enabled = 0;
        }
        return adminUser;
      } catch (e2) {
        return null;
      }
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
        user.notify_admin_new_user_enabled = 0;
        user.notify_admin_new_post_enabled = 0;
        return user;
      }
      try {
        const adminUser = await db
          .prepare(
            'SELECT users.id, users.username, users.role, users.email, users.phone, users.password_hash, users.must_change_password, users.notify_email_enabled, users.notify_sms_enabled FROM admin_sessions JOIN users ON users.id = admin_sessions.user_id WHERE admin_sessions.token = ?'
          )
          .bind(token)
          .first();
        if (adminUser) {
          adminUser.ui_lore_enabled = 0;
          adminUser.default_landing_page = 'home';
          adminUser.preferred_username_color_index = null;
          adminUser.notify_admin_new_user_enabled = 0;
          adminUser.notify_admin_new_post_enabled = 0;
        }
        return adminUser;
      } catch (e3) {
        return null;
      }
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
