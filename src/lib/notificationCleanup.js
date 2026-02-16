/**
 * Remove in-app notifications when the triggering action is undone
 * (unlike, un-RSVP, content deleted, comment/reply deleted).
 * Keeps notification list free of broken links.
 */

/**
 * Remove the "like" notification when a user unlikes.
 * @param {object} db - D1 database
 * @param {string} postType - target_type (e.g. post, event, music_post)
 * @param {string} postId - target_id
 * @param {string} actorUserId - user who unliked (actor_user_id of the notification)
 */
export async function deleteNotificationsForLike(db, postType, postId, actorUserId) {
  try {
    await db
      .prepare(
        'DELETE FROM notifications WHERE type = ? AND target_type = ? AND target_id = ? AND actor_user_id = ?'
      )
      .bind('like', postType, postId, actorUserId)
      .run();
  } catch (e) {
    // Table or column may not exist in older deployments
  }
}

/**
 * Remove RSVP notification when a user un-RSVPs.
 */
export async function deleteNotificationsForRsvp(db, eventId, actorUserId) {
  try {
    await db
      .prepare(
        'DELETE FROM notifications WHERE type = ? AND target_type = ? AND target_id = ? AND actor_user_id = ?'
      )
      .bind('rsvp', 'event', eventId, actorUserId)
      .run();
  } catch (e) {
    // Ignore
  }
}

/**
 * Remove all notifications that point to a given content (post, thread, event, etc.).
 * Call when that content is soft-deleted so no notification links to it.
 */
export async function deleteNotificationsForTarget(db, targetType, targetId) {
  try {
    await db
      .prepare('DELETE FROM notifications WHERE target_type = ? AND target_id = ?')
      .bind(targetType, targetId)
      .run();
  } catch (e) {
    // Ignore
  }
}

/**
 * Remove notifications for a specific comment or reply (when that comment/reply is deleted).
 * Requires notifications.target_sub_id to be set when the notification was created.
 */
export async function deleteNotificationsForTargetSubId(db, targetSubId) {
  if (!targetSubId) return;
  try {
    await db
      .prepare('DELETE FROM notifications WHERE target_sub_id = ?')
      .bind(targetSubId)
      .run();
  } catch (e) {
    // Column may not exist in older deployments
  }
}

/**
 * Insert a notification row. If target_sub_id is provided, tries 8-column insert first;
 * on failure (e.g. column missing), retries without target_sub_id for rollout safety.
 */
export async function insertNotificationWithOptionalSubId(db, row) {
  const hasSub = row.target_sub_id != null && row.target_sub_id !== '';
  const base = [
    row.id,
    row.user_id,
    row.actor_user_id,
    row.type,
    row.target_type,
    row.target_id,
    row.created_at
  ];
  if (hasSub) {
    try {
      await db
        .prepare(
          'INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at, target_sub_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(...base, row.target_sub_id)
        .run();
      return;
    } catch (e) {
      // Column may not exist yet
    }
  }
  await db
    .prepare(
      'INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(...base)
    .run();
}
