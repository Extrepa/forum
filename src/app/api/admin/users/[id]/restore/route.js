import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../lib/db';
import { getSessionUser } from '../../../../../../lib/auth';
import { isAdminUser } from '../../../../../../lib/admin';
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

  const db = await getDb();
  const target = await db.prepare('SELECT id, username, is_deleted FROM users WHERE id = ?').bind(id).first();
  if (!target) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!target.is_deleted) {
    return NextResponse.json({ ok: true, alreadyActive: true });
  }

  const now = Date.now();
  try {
    await db
      .prepare(
        `UPDATE users
         SET is_deleted = 0,
             deleted_at = NULL,
             deleted_by_user_id = NULL
         WHERE id = ?`
      )
      .bind(id)
      .run();
  } catch (e) {
    const msg = e?.message ?? String(e);
    console.error('Admin user restore UPDATE failed:', msg);
    return NextResponse.json({ error: msg || 'Restore failed' }, { status: 500 });
  }

  await notifyAdminsOfEvent({
    db,
    eventType: 'user_restored',
    actorUser: user,
    targetType: 'user',
    targetId: id,
    createdAt: now
  });

  await logAdminAction({
    adminUserId: user.id,
    actionType: 'restore_user',
    targetType: 'user',
    targetId: id,
    metadata: { restoredUsername: target.username }
  });

  return NextResponse.json({ ok: true, id });
}
