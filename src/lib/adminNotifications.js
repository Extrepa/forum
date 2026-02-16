export async function notifyAdminsOfNewPost({
  db,
  actorUser,
  targetType,
  targetId,
  createdAt = Date.now()
}) {
  if (!db || !actorUser?.id || !targetType || !targetId || actorUser.role === 'admin') {
    return;
  }

  try {
    const { results: admins } = await db
      .prepare('SELECT id FROM users WHERE role = ? AND notify_admin_new_post_enabled = 1')
      .bind('admin')
      .all();

    if (!admins?.length) {
      return;
    }

    await Promise.all(
      admins.map((admin) =>
        db
          .prepare(
            `INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(),
            admin.id,
            actorUser.id,
            'admin_post',
            targetType,
            targetId,
            createdAt
          )
          .run()
      )
    );
  } catch (e) {
    // Ignore admin notification failures.
  }
}

/**
 * Notify admins who have the given event type enabled in notify_admin_events JSON.
 * Event types: post_deleted, content_edited, content_hidden, content_locked, content_moved,
 * content_pinned, content_restored, user_deleted, user_role_changed.
 * Call this from delete/edit/hide/lock/move/pin/restore/role routes when actions occur.
 */
export async function notifyAdminsOfEvent({
  db,
  eventType,
  actorUser,
  targetType,
  targetId,
  createdAt = Date.now()
}) {
  if (!db || !eventType || !targetType) {
    return;
  }

  try {
    const { results: admins } = await db
      .prepare('SELECT id, notify_admin_events FROM users WHERE role = ?')
      .bind('admin')
      .all();

    if (!admins?.length) {
      return;
    }

    const recipientIds = [];
    for (const admin of admins) {
      let events = {};
      try {
        events = typeof admin.notify_admin_events === 'string'
          ? JSON.parse(admin.notify_admin_events || '{}')
          : (admin.notify_admin_events || {});
      } catch {
        events = {};
      }
      if (events[eventType]) {
        recipientIds.push(admin.id);
      }
    }

    if (!recipientIds.length) {
      return;
    }

    const actorId = actorUser?.id ?? null;
    await Promise.all(
      recipientIds.map((userId) =>
        db
          .prepare(
            `INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(),
            userId,
            actorId,
            'admin_event',
            targetType,
            targetId ?? null,
            createdAt
          )
          .run()
      )
    );
  } catch (e) {
    // Ignore admin notification failures.
  }
}
