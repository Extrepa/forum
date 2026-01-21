import { getDb } from './db';
import { getSessionToken } from './session';

export async function getSessionUser() {
  const token = getSessionToken();
  if (!token) {
    return null;
  }
  const db = await getDb();
  return db
    .prepare(
      'SELECT id, username, role, email, must_change_password, notify_email_enabled, notify_sms_enabled FROM users WHERE session_token = ?'
    )
    .bind(token)
    .first();
}
