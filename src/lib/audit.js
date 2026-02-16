import { getDb } from './db';

/**
 * Log user activity (post created, reply to post, reply to reply) with a single schema
 * so profile recent activity and system/audit views stay consistent.
 * @param {{ userId: string, username?: string, actionType: string, targetType: string, targetId?: string, targetTitle?: string, sectionKey?: string, parentId?: string, source: string }}
 */
export async function logUserActivity({ userId, username = null, actionType, targetType, targetId = null, targetTitle = null, sectionKey = null, parentId = null, source }) {
  if (!userId || !actionType || !targetType || !source) return;
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO user_activity_log (id, created_at, user_id, username, action_type, target_type, target_id, target_title, section_key, parent_id, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(globalThis.crypto.randomUUID(), Date.now(), userId, username, actionType, targetType, targetId ?? null, targetTitle ?? null, sectionKey ?? null, parentId ?? null, source)
    .run();
}

export async function logAdminAction({ adminUserId, actionType, targetType, targetId = null, metadata = null }) {
  if (!adminUserId || !actionType || !targetType) {
    return;
  }
  const db = await getDb();
  const payload = metadata ? JSON.stringify(metadata) : null;
  await db
    .prepare(
      'INSERT INTO admin_actions (id, admin_user_id, action_type, target_type, target_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(globalThis.crypto.randomUUID(), adminUserId, actionType, targetType, targetId, payload, Date.now())
    .run();
}

export async function getRecentAdminActions(dbInstance, limit = null) {
  const db = dbInstance || (await getDb());
  const hasLimit = Number.isFinite(limit) && Number(limit) > 0;
  const query = hasLimit
    ? `SELECT admin_actions.id, admin_actions.action_type, admin_actions.target_type,
              admin_actions.target_id, admin_actions.metadata, admin_actions.created_at,
              users.username AS admin_username
       FROM admin_actions
       JOIN users ON users.id = admin_actions.admin_user_id
       ORDER BY admin_actions.created_at DESC
       LIMIT ?`
    : `SELECT admin_actions.id, admin_actions.action_type, admin_actions.target_type,
              admin_actions.target_id, admin_actions.metadata, admin_actions.created_at,
              users.username AS admin_username
       FROM admin_actions
       JOIN users ON users.id = admin_actions.admin_user_id
       ORDER BY admin_actions.created_at DESC`;
  const statement = db.prepare(query);
  const rows = hasLimit ? await statement.bind(Number(limit)).all() : await statement.all();
  const result = [];
  for (const row of rows?.results || []) {
    let parsed = null;
    if (row.metadata) {
      try {
        parsed = JSON.parse(row.metadata);
      } catch (e) {
        parsed = null;
      }
    }
    result.push({
      ...row,
      metadata: parsed
    });
  }
  return result;
}
