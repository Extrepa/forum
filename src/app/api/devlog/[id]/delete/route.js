import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser, isModUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';
import { deleteNotificationsForTarget } from '../../../../../lib/notificationCleanup';

export async function POST(request, { params }) {
  // Next.js 15: params is a Promise, must await
  const { id } = await params;
  
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  
  // Get dev log to check ownership
  const log = await db
    .prepare('SELECT author_user_id FROM dev_logs WHERE id = ?')
    .bind(id)
    .first();

  if (!log) {
    return NextResponse.json({ error: 'notfound' }, { status: 404 });
  }

  const isAdmin = isAdminUser(user);
  const canDelete = log.author_user_id === user.id || isModUser(user);

  if (!canDelete) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  try {
    await db
      .prepare('UPDATE dev_logs SET is_deleted = 1, updated_at = ? WHERE id = ?')
      .bind(Date.now(), id)
      .run();
  } catch (e) {
    return NextResponse.json({ error: 'notready' }, { status: 409 });
  }
  await deleteNotificationsForTarget(db, 'dev_log', id);
  if (isAdmin) {
    await logAdminAction({
      adminUserId: user.id,
      actionType: 'delete_post',
      targetType: 'dev_log',
      targetId: id
    });
  }

  return NextResponse.json({ ok: true });
}
