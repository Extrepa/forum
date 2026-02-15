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
