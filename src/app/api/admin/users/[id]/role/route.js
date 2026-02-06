import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../lib/db';
import { getSessionUser } from '../../../../../../lib/auth';
import { isAdminUser } from '../../../../../../lib/admin';
import { logAdminAction } from '../../../../../../lib/audit';

const VALID_ROLES = ['user', 'mod', 'admin'];

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
    try {
      const formData = await request.formData();
      payload.role = formData.get('role');
    } catch (e2) {
      payload = {};
    }
  }

  const nextRole = String(payload.role || '').trim();
  if (!VALID_ROLES.includes(nextRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  if (user.id === id && nextRole !== 'admin') {
    return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 });
  }

  const db = await getDb();
  const target = await db.prepare('SELECT id, role, is_deleted FROM users WHERE id = ?').bind(id).first();
  if (!target) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (target.is_deleted) {
    return NextResponse.json({ error: 'User deleted' }, { status: 409 });
  }

  if (target.role === nextRole) {
    return NextResponse.json({ ok: true, role: nextRole });
  }

  await db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(nextRole, id).run();

  if (nextRole !== 'admin') {
    try {
      await db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').bind(id).run();
    } catch (e) {
      // Ignore if admin_sessions table doesn't exist yet
    }
  }

  await logAdminAction({
    adminUserId: user.id,
    actionType: 'update_user_role',
    targetType: 'user',
    targetId: id,
    metadata: { role: nextRole }
  });

  return NextResponse.json({ ok: true, role: nextRole });
}
