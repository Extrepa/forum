import { getDb } from './db';

/**
 * Extracts usernames from text (e.g. @username)
 * @param {string} text 
 * @returns {string[]} Array of normalized usernames
 */
export function extractMentions(text) {
  if (!text) return [];
  // Match @username preceded by start of line or whitespace.
  // Usernames are 3-20 chars: a-z, 0-9, or underscores.
  const regex = /(?:^|\s)@([a-z0-9_]{3,20})\b/gi;
  const usernames = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    usernames.push(match[1].toLowerCase());
  }
  return [...new Set(usernames)];
}

/**
 * Creates mention notifications for users found in text.
 * @param {Object} options
 * @param {string} options.text - The content to parse for mentions
 * @param {string} options.actorId - The user ID of the person doing the mentioning
 * @param {string} options.targetType - The type of content (e.g. 'post', 'comment')
 * @param {string} options.targetId - The ID of the content
 */
export async function createMentionNotifications({ text, actorId, targetType, targetId }) {
  const usernames = extractMentions(text);
  if (usernames.length === 0) return;

  const db = await getDb();
  
  // Resolve usernames to user IDs and check preferences
  const placeholders = usernames.map(() => '?').join(',');
  const { results: users } = await db
    .prepare(`SELECT id, username_norm, notify_mention_enabled FROM users WHERE username_norm IN (${placeholders})`)
    .bind(...usernames)
    .all();

  if (!users || users.length === 0) return;

  const now = Date.now();
  for (const user of users) {
    if (user.id === actorId) continue; // Don't notify yourself
    if (user.notify_mention_enabled === 0) continue; // Respect user preference

    try {
      await db
        .prepare(
          'INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          crypto.randomUUID(),
          user.id,
          actorId,
          'mention',
          targetType,
          targetId,
          now
        )
        .run();
    } catch (e) {
      // Ignore failures (e.g. unique constraint if they are already being notified for something else)
      // Actually, notifications don't have a unique constraint on (user_id, type, target_id) but maybe they should?
      // For mentions, it's fine to have multiple if it's different.
    }
  }
}
