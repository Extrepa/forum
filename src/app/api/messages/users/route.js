import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { canMessageByRole, ROLE_DRIPLET, ROLE_DRIP_NOMAD, ROLE_MOD, ROLE_ADMIN } from '../../../../lib/roles';

/** Roles the sender can message. Used to filter user search. */
const MESSAGEABLE_ROLES = {
  [ROLE_DRIPLET]: [ROLE_DRIPLET],
  [ROLE_DRIP_NOMAD]: [ROLE_DRIPLET, ROLE_DRIP_NOMAD],
  [ROLE_MOD]: [ROLE_DRIPLET, ROLE_DRIP_NOMAD, ROLE_MOD],
  [ROLE_ADMIN]: [ROLE_DRIPLET, ROLE_DRIP_NOMAD, ROLE_MOD, ROLE_ADMIN],
};

/** GET /api/messages/users?q= - Search users (1+ chars). For DMs: messageable only. Add for=mentions for forum-wide. */
/** GET /api/messages/users?list=recent - Return recent conversation participants (for quick picker). */
/** GET /api/messages/users?list=all - For @mentions: all users. For DMs: messageable only. Add for=mentions for forum-wide. */
export async function GET(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get('q') || '').trim();
  const list = searchParams.get('list');
  const forMentions = searchParams.get('for') === 'mentions'; // Forum-wide @mentions (posts, comments): all users

  const db = await getDb();
  const senderRole = user.role || ROLE_DRIPLET;
  const allowedRoles = MESSAGEABLE_ROLES[senderRole] || [ROLE_DRIPLET];
  const rolePlaceholders = allowedRoles.map(() => '?').join(',');

  try {
    // list=all: return users for @mention autocomplete (no search query)
    if (list === 'all') {
      const roleFilter = forMentions ? '' : `AND role IN (${rolePlaceholders})`;
      const bindArgs = forMentions ? [user.id] : [user.id, ...allowedRoles];
      const { results } = await db
        .prepare(
          `SELECT id, username, preferred_username_color_index
           FROM users
           WHERE id != ? AND (is_deleted = 0 OR is_deleted IS NULL) ${roleFilter}
           ORDER BY username ASC
           LIMIT 50`
        )
        .bind(...bindArgs)
        .all();

      return NextResponse.json({
        users: (results || []).map((u) => ({
          id: u.id,
          username: u.username,
          preferred_username_color_index: u.preferred_username_color_index,
        })),
      });
    }

    // list=recent: return users from recent conversations (for quick picker without typing)
    if (list === 'recent') {
      const { results } = await db
        .prepare(
          `SELECT DISTINCT u.id, u.username, u.preferred_username_color_index
           FROM dm_participants p
           JOIN dm_conversations c ON c.id = p.conversation_id
           JOIN dm_participants p2 ON p2.conversation_id = c.id AND p2.user_id != ?
           JOIN users u ON u.id = p2.user_id
           WHERE p.user_id = ? AND p.left_at IS NULL
             AND u.id != ?
             AND (u.is_deleted = 0 OR u.is_deleted IS NULL)
             AND u.role IN (${rolePlaceholders})
           ORDER BY c.updated_at DESC
           LIMIT 20`
        )
        .bind(user.id, user.id, user.id, ...allowedRoles)
        .all();

      return NextResponse.json({
        users: (results || []).map((u) => ({
          id: u.id,
          username: u.username,
          preferred_username_color_index: u.preferred_username_color_index,
        })),
      });
    }

    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const term = `%${q}%`;
    const normTerm = `%${q.toLowerCase()}%`;
    const roleFilter = forMentions ? '' : `AND role IN (${rolePlaceholders})`;
    const bindArgs = forMentions ? [term, normTerm, user.id] : [term, normTerm, user.id, ...allowedRoles];

    const { results } = await db
      .prepare(
        `SELECT id, username, preferred_username_color_index
         FROM users
         WHERE (username LIKE ? OR username_norm LIKE ?)
           AND id != ?
           AND (is_deleted = 0 OR is_deleted IS NULL)
           ${roleFilter}
         ORDER BY username ASC
         LIMIT 30`
      )
      .bind(...bindArgs)
      .all();

    return NextResponse.json({
      users: (results || []).map((u) => ({
        id: u.id,
        username: u.username,
        preferred_username_color_index: u.preferred_username_color_index,
      })),
    });
  } catch (e) {
    console.error('Error searching users:', e);
    return NextResponse.json({ users: [] });
  }
}
