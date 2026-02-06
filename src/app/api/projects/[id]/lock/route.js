import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const redirectUrl = new URL(`/projects/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!isAdminUser(user)) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const locked = String(formData.get('locked') || '').trim() === '1' ? 1 : 0;

  const db = await getDb();
  const project = await db
    .prepare('SELECT author_user_id FROM projects WHERE id = ?')
      .bind(id)
    .first();

  if (!project) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Rollout-safe: try to update is_locked, fall back gracefully if column doesn't exist
  try {
    await db
      .prepare('UPDATE projects SET is_locked = ?, updated_at = ? WHERE id = ?')
      .bind(locked, Date.now(), params.id)
      .run();
    if (isAdminUser(user)) {
      await logAdminAction({
        adminUserId: user.id,
        actionType: 'toggle_lock',
        targetType: 'project',
        targetId: id,
        metadata: { locked: locked === 1 }
      });
    }
  } catch (e) {
    // Column doesn't exist yet - that's okay, just skip the update
    // In the future, a migration will add this column
  }

  return NextResponse.redirect(redirectUrl, 303);
}
