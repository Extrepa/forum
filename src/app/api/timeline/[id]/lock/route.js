import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const redirectUrl = new URL(`/announcements/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const locked = String(formData.get('locked') || '').trim() === '1' ? 1 : 0;

  const db = await getDb();
  const update = await db
    .prepare('SELECT author_user_id FROM timeline_updates WHERE id = ?')
    .bind(id)
    .first();

  if (!update) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const isAdmin = isAdminUser(user);
  const canToggle = update.author_user_id === user.id || isAdmin;
  if (!canToggle) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Rollout-safe: try to update is_locked, fall back gracefully if column doesn't exist
  try {
    await db
      .prepare('UPDATE timeline_updates SET is_locked = ?, updated_at = ? WHERE id = ?')
      .bind(locked, Date.now(), id)
      .run();
    if (isAdmin) {
      await logAdminAction({
        adminUserId: user.id,
        actionType: 'toggle_lock',
        targetType: 'timeline_update',
        targetId: id,
        metadata: { locked: locked === 1 }
      });
    }
  } catch (e) {
    // Column might not exist yet - that's okay, migration will add it
    console.error('Error updating timeline lock status (column may not exist yet):', e);
  }

  return NextResponse.redirect(redirectUrl, 303);
}
