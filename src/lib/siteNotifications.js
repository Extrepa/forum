/**
 * Site-level notification helpers: new forum threads, new content by section, nomad activity.
 * Recipients are determined by user prefs (notify_new_forum_threads_enabled,
 * notify_new_content_sections, notify_nomad_activity_enabled).
 */

import { parseNewContentSectionsJson, ALL_NEW_CONTENT_KEYS } from './notificationSections';

/**
 * Notify users who opted in to "New forum threads" (and optional section filter).
 * sectionKey: 'lobby_general' | 'lobby_shitposts'. If user has no section toggles on, they get all; else only if they have this section enabled.
 */
export async function notifyUsersOfNewForumThread({
  db,
  actorUser,
  threadId,
  sectionKey,
  createdAt = Date.now()
}) {
  if (!db || !actorUser?.id || !threadId || !sectionKey) return;

  try {
    const { results: users } = await db
      .prepare(
        `SELECT id, notify_new_content_sections FROM users
         WHERE notify_new_forum_threads_enabled = 1 AND id != ?
           AND (is_deleted = 0 OR is_deleted IS NULL)`
      )
      .bind(actorUser.id)
      .all();

    if (!users?.length) return;

    const recipientIds = [];
    for (const u of users) {
      const sections = parseNewContentSectionsJson(u.notify_new_content_sections);
      const anySectionOn = ALL_NEW_CONTENT_KEYS.some((k) => sections[k]);
      if (!anySectionOn || sections[sectionKey]) {
        recipientIds.push(u.id);
      }
    }

    if (!recipientIds.length) return;

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
            actorUser.id,
            'new_forum_thread',
            'forum_thread',
            threadId,
            createdAt
          )
          .run()
      )
    );
  } catch (e) {
    // Ignore site notification failures
  }
}

/**
 * Notify users who opted in to new content for this section (and nomad activity when sectionKey === 'nomads').
 * sectionKey: one of art, nostalgia, bugs, rant, lore, memories, about, nomads.
 * targetType: 'post' for section posts; targetId: post id.
 */
export async function notifyUsersOfNewContent({
  db,
  actorUser,
  targetType,
  targetId,
  sectionKey,
  createdAt = Date.now()
}) {
  if (!db || !actorUser?.id || !targetType || !targetId || !sectionKey) return;

  try {
    const { results: users } = await db
      .prepare(
        `SELECT id, notify_new_content_sections, notify_nomad_activity_enabled
         FROM users
         WHERE id != ? AND (is_deleted = 0 OR is_deleted IS NULL)`
      )
      .bind(actorUser.id)
      .all();

    if (!users?.length) return;

    const recipientIds = [];
    for (const u of users) {
      const sections = parseNewContentSectionsJson(u.notify_new_content_sections);
      const wantThisSection = !!sections[sectionKey];
      const wantNomad = sectionKey === 'nomads' && (u.notify_nomad_activity_enabled === 1 || u.notify_nomad_activity_enabled === true);
      if (wantThisSection || wantNomad) {
        recipientIds.push(u.id);
      }
    }

    if (!recipientIds.length) return;

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
            actorUser.id,
            'new_content',
            targetType,
            targetId,
            createdAt
          )
          .run()
      )
    );
  } catch (e) {
    // Ignore site notification failures
  }
}
