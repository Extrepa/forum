import { getDb } from './db';

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
