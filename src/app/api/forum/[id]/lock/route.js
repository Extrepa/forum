import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';
import { notifyAdminsOfEvent } from '../../../../../lib/adminNotifications';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const redirectUrl = new URL(`/lobby/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const locked = String(formData.get('locked') || '').trim() === '1' ? 1 : 0;

  const db = await getDb();
  const thread = await db
    .prepare('SELECT author_user_id FROM forum_threads WHERE id = ?')
      .bind(id)
    .first();

  if (!thread) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const isAdmin = isAdminUser(user);
  const canToggle = thread.author_user_id === user.id || isAdmin;
  if (!canToggle) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const now = Date.now();
  await db
    .prepare('UPDATE forum_threads SET is_locked = ?, updated_at = ? WHERE id = ?')
    .bind(locked, now, id)
    .run();

  await notifyAdminsOfEvent({
    db,
    eventType: 'content_locked',
    actorUser: user,
    targetType: 'forum_thread',
    targetId: id,
    createdAt: now
  });

  if (isAdmin) {
    await logAdminAction({
      adminUserId: user.id,
      actionType: 'toggle_lock',
      targetType: 'forum_thread',
      targetId: id,
      metadata: { locked }
    });
  }

  return NextResponse.redirect(redirectUrl, 303);
}
