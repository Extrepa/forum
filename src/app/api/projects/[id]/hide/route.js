import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';
import { notifyAdminsOfEvent } from '../../../../../lib/adminNotifications';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const redirectUrl = new URL(`/projects/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const project = await db
    .prepare('SELECT author_user_id FROM projects WHERE id = ?')
    .bind(id)
    .first();

  if (!project) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const isAdmin = isAdminUser(user);
  const canToggle = project.author_user_id === user.id || isAdmin;
  if (!canToggle) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const hidden = String(formData.get('hidden') || '').trim() === '1' ? 1 : 0;
  const now = Date.now();

  try {
    await db
      .prepare('UPDATE projects SET is_hidden = ?, updated_at = ? WHERE id = ?')
      .bind(hidden, now, id)
      .run();
    await notifyAdminsOfEvent({
      db,
      eventType: 'content_hidden',
      actorUser: user,
      targetType: 'project',
      targetId: id,
      createdAt: now
    });
    if (isAdmin) {
      await logAdminAction({
        adminUserId: user.id,
        actionType: 'toggle_hidden',
        targetType: 'project',
        targetId: id,
        metadata: { hidden: hidden === 1 }
      });
    }
  } catch (e) {
    console.error('Error updating project hidden status (column may not exist yet):', e);
  }

  return NextResponse.redirect(redirectUrl, 303);
}
