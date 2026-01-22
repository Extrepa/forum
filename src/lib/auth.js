import { getDb } from './db';
import { getSessionToken } from './session';

export async function getSessionUser() {
  const token = await getSessionToken();
  if (!token) {
    return null;
  }
  const db = await getDb();
  try {
    return await db
      .prepare(
        'SELECT id, username, role, email, phone, password_hash, must_change_password, notify_email_enabled, notify_sms_enabled, ui_lore_enabled, default_landing_page FROM users WHERE session_token = ?'
      )
      .bind(token)
      .first();
  } catch (e) {
    try {
      const user = await db
        .prepare(
          'SELECT id, username, role, email, phone, password_hash, must_change_password, notify_email_enabled, notify_sms_enabled, ui_lore_enabled FROM users WHERE session_token = ?'
        )
        .bind(token)
        .first();
      if (user) {
        user.ui_lore_enabled = user.ui_lore_enabled ?? 0;
        user.default_landing_page = 'home';
      }
      return user;
    } catch (e2) {
      const user = await db
        .prepare(
          'SELECT id, username, role, email, phone, password_hash, must_change_password, notify_email_enabled, notify_sms_enabled FROM users WHERE session_token = ?'
        )
        .bind(token)
        .first();
      if (user) {
        user.ui_lore_enabled = 0;
        user.default_landing_page = 'home';
      }
      return user;
    }
  }
}
