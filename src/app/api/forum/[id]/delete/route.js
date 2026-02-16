import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser, isModUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';
import { notifyAdminsOfEvent } from '../../../../../lib/adminNotifications';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  
  // Get thread to check ownership
  const thread = await db
    .prepare('SELECT author_user_id FROM forum_threads WHERE id = ?')
    .bind(id)
    .first();

  if (!thread) {
    return NextResponse.json({ error: 'notfound' }, { status: 404 });
  }

  const isAdmin = isAdminUser(user);
  const canDelete = thread.author_user_id === user.id || isModUser(user);

  if (!canDelete) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  const now = Date.now();
  await db
    .prepare('UPDATE forum_threads SET is_deleted = 1, updated_at = ? WHERE id = ?')
    .bind(now, id)
    .run();
  await notifyAdminsOfEvent({
    db,
    eventType: 'post_deleted',
    actorUser: user,
    targetType: 'forum_thread',
    targetId: id,
    createdAt: now
  });
  if (isAdmin) {
    await logAdminAction({
      adminUserId: user.id,
      actionType: 'delete_post',
      targetType: 'forum_thread',
      targetId: id
    });
  }

  return NextResponse.json({ ok: true });
}
