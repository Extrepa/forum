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

/** GET /api/messages/users?q= - Search users for composing a message. Only returns users the sender can message by role. */
export async function GET(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get('q') || '').trim();

  const db = await getDb();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const term = `%${q}%`;
  const normTerm = `%${q.toLowerCase()}%`;
  const senderRole = user.role || ROLE_DRIPLET;
  const allowedRoles = MESSAGEABLE_ROLES[senderRole] || [ROLE_DRIPLET];
  const rolePlaceholders = allowedRoles.map(() => '?').join(',');

  try {
    const { results } = await db
      .prepare(
        `SELECT id, username, preferred_username_color_index
         FROM users
         WHERE (username LIKE ? OR username_norm LIKE ?)
           AND id != ?
           AND (is_deleted = 0 OR is_deleted IS NULL)
           AND role IN (${rolePlaceholders})
         ORDER BY username ASC
         LIMIT 30`
      )
      .bind(term, normTerm, user.id, ...allowedRoles)
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
