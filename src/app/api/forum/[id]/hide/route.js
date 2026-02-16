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

  const formData = await request.formData();
  const hidden = String(formData.get('hidden') || '').trim() === '1' ? 1 : 0;
  const now = Date.now();

  try {
    await db
      .prepare('UPDATE forum_threads SET is_hidden = ?, updated_at = ? WHERE id = ?')
      .bind(hidden, now, id)
      .run();
    await notifyAdminsOfEvent({
      db,
      eventType: 'content_hidden',
      actorUser: user,
      targetType: 'forum_thread',
      targetId: id,
      createdAt: now
    });
    if (isAdmin) {
      await logAdminAction({
        adminUserId: user.id,
        actionType: 'toggle_hidden',
        targetType: 'forum_thread',
        targetId: id,
        metadata: { hidden }
      });
    }
  } catch (e) {
    console.error('Error updating thread hidden status (column may not exist yet):', e);
  }

  return NextResponse.redirect(redirectUrl, 303);
}
