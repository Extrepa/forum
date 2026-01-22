import { getDb } from './db';
import { getSessionToken } from './session';

export function isAdminUser(user) {
  return user && user.role === 'admin';
}

export async function getSessionUserWithRole() {
  const token = await getSessionToken();
  if (!token) {
    return null;
  }
  const db = await getDb();
  try {
    return await db
      .prepare('SELECT id, username, role, ui_lore_enabled FROM users WHERE session_token = ?')
      .bind(token)
      .first();
  } catch (e) {
    const user = await db.prepare('SELECT id, username, role FROM users WHERE session_token = ?').bind(token).first();
    if (user) {
      user.ui_lore_enabled = 0;
    }
    return user;
  }
}
