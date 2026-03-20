import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../lib/db';
import { getSessionUser } from '../../../../../../lib/auth';
import { isAdminUser } from '../../../../../../lib/admin';
import { normalizeUsername } from '../../../../../../lib/username';
import { logAdminAction } from '../../../../../../lib/audit';
import { notifyAdminsOfEvent } from '../../../../../../lib/adminNotifications';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (e) {
    payload = {};
  }
  if (String(payload.confirm || '') !== 'yes') {
    return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
  }

  if (user.id === id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  const db = await getDb();
  const target = await db.prepare('SELECT id, username, is_deleted FROM users WHERE id = ?').bind(id).first();
  if (!target) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (target.is_deleted) {
    return NextResponse.json({ ok: true });
  }

  const anonymizedUsername = `deleted-${id.slice(0, 8)}`;
  const usernameNorm = normalizeUsername(anonymizedUsername);
  const now = Date.now();
  // session_token is NOT NULL + UNIQUE in 0001_init — cannot set NULL. Use a revoked placeholder.
  const revokedSessionToken = `revoked-${id}-${now}`;

  // Minimal UPDATE: only columns from base schema (0001, 0006, 0008) + 0063 soft-delete.
  // Avoids failing on missing notify_* / avatar columns when not all migrations are applied.
  try {
    await db
      .prepare(
        `UPDATE users
         SET username = ?,
             username_norm = ?,
             role = 'user',
             session_token = ?,
             email = NULL,
             email_norm = NULL,
             phone = NULL,
             phone_norm = NULL,
             password_hash = NULL,
             password_set_at = NULL,
             must_change_password = 0,
             is_deleted = 1,
             deleted_at = ?,
             deleted_by_user_id = ?
         WHERE id = ?`
      )
      .bind(anonymizedUsername, usernameNorm, revokedSessionToken, now, user.id, id)
      .run();
  } catch (e) {
    const msg =
      (typeof e?.message === 'string' && e.message) ||
      (typeof e?.cause?.message === 'string' && e.cause.message) ||
      String(e);
    console.error('Admin user delete UPDATE failed:', msg, e);
    const looksLikeMissingSoftDelete = /no such column.*is_deleted/i.test(msg);
    return NextResponse.json(
      {
        error: msg || 'User delete failed (database error)',
        hint: looksLikeMissingSoftDelete
          ? 'Apply migration 0063_user_soft_delete.sql (is_deleted, deleted_at, deleted_by_user_id).'
          : undefined
      },
      { status: 409 }
    );
  }

  try {
    await db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').bind(id).run();
  } catch (e) {
    // Ignore if admin_sessions table doesn't exist yet
  }

  await notifyAdminsOfEvent({
    db,
    eventType: 'user_deleted',
    actorUser: user,
    targetType: 'user',
    targetId: id,
    createdAt: now
  });

  await logAdminAction({
    adminUserId: user.id,
    actionType: 'delete_user',
    targetType: 'user',
    targetId: id,
    metadata: { previousUsername: target.username }
  });

  return NextResponse.json({ ok: true });
}
