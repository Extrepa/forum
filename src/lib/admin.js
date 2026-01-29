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
    const user = await db
      .prepare('SELECT id, username, role, ui_lore_enabled, ui_color_mode, ui_border_color, ui_invert_colors FROM users WHERE session_token = ?')
      .bind(token)
      .first();
    if (user) {
      return user;
    }
    try {
      return await db
        .prepare(
          'SELECT users.id, users.username, users.role, users.ui_lore_enabled, users.ui_color_mode, users.ui_border_color, users.ui_invert_colors FROM admin_sessions JOIN users ON users.id = admin_sessions.user_id WHERE admin_sessions.token = ?'
        )
        .bind(token)
        .first();
    } catch (e2) {
      return null;
    }
  } catch (e) {
    const user = await db.prepare('SELECT id, username, role FROM users WHERE session_token = ?').bind(token).first();
    if (user) {
      user.ui_lore_enabled = 0;
      user.ui_color_mode = 0;
      user.ui_border_color = null;
      user.ui_invert_colors = 0;
      return user;
    }
    try {
      const adminUser = await db
        .prepare('SELECT users.id, users.username, users.role FROM admin_sessions JOIN users ON users.id = admin_sessions.user_id WHERE admin_sessions.token = ?')
        .bind(token)
        .first();
      if (adminUser) {
        adminUser.ui_lore_enabled = 0;
        adminUser.ui_color_mode = 0;
        adminUser.ui_border_color = null;
        adminUser.ui_invert_colors = 0;
      }
      return adminUser;
    } catch (e2) {
      return null;
    }
  }
}
