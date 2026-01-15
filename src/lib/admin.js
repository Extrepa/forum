import { getDb } from './db';
import { getSessionToken } from './session';

export function isAdminUser(user) {
  return user && user.role === 'admin';
}

export async function getSessionUserWithRole() {
  const token = getSessionToken();
  if (!token) {
    return null;
  }
  const db = await getDb();
  return db
    .prepare('SELECT id, username, role FROM users WHERE session_token = ?')
    .bind(token)
    .first();
}
