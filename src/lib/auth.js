import { getDb } from './db';
import { getSessionToken } from './session';

export async function getSessionUser() {
  const token = getSessionToken();
  if (!token) {
    return null;
  }
  const db = await getDb();
  try {
    return await db
      .prepare(
        'SELECT id, username, role, email, phone, password_hash, must_change_password, notify_email_enabled, notify_sms_enabled, ui_lore_enabled FROM users WHERE session_token = ?'
      )
      .bind(token)
      .first();
  } catch (e) {
    const user = await db
      .prepare(
        'SELECT id, username, role, email, phone, password_hash, must_change_password, notify_email_enabled, notify_sms_enabled FROM users WHERE session_token = ?'
      )
      .bind(token)
      .first();
    if (user) {
      user.ui_lore_enabled = 0;
    }
    return user;
  }
}
