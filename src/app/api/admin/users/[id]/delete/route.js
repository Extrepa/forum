import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../lib/db';
import { getSessionUser } from '../../../../../../lib/auth';
import { isAdminUser } from '../../../../../../lib/admin';
import { normalizeUsername } from '../../../../../../lib/username';
import { logAdminAction } from '../../../../../../lib/audit';

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

  try {
    await db
      .prepare(
        `UPDATE users
         SET username = ?,
             username_norm = ?,
             role = 'user',
             session_token = NULL,
             email = NULL,
             email_norm = NULL,
             phone = NULL,
             phone_norm = NULL,
             password_hash = NULL,
             password_set_at = NULL,
             must_change_password = 0,
             notify_email_enabled = 0,
             notify_sms_enabled = 0,
             notify_rsvp_enabled = 0,
             notify_like_enabled = 0,
             notify_update_enabled = 0,
             notify_mention_enabled = 0,
             notify_reply_enabled = 0,
             notify_comment_enabled = 0,
             notify_admin_new_user_enabled = 0,
             notify_admin_new_post_enabled = 0,
             notify_admin_new_reply_enabled = 0,
             avatar_key = NULL,
             avatar_state = NULL,
             is_deleted = 1,
             deleted_at = ?,
             deleted_by_user_id = ?
         WHERE id = ?`
      )
      .bind(anonymizedUsername, usernameNorm, now, user.id, id)
      .run();
  } catch (e) {
    return NextResponse.json({ error: 'Migration missing for users delete' }, { status: 409 });
  }

  try {
    await db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').bind(id).run();
  } catch (e) {
    // Ignore if admin_sessions table doesn't exist yet
  }

  await logAdminAction({
    adminUserId: user.id,
    actionType: 'delete_user',
    targetType: 'user',
    targetId: id,
    metadata: { previousUsername: target.username }
  });

  return NextResponse.json({ ok: true });
}
