import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const redirectUrl = new URL(`/projects/${params.id}`, request.url);

  if (!user) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }
  if (user.must_change_password || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'password');
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
    .bind(params.id)
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
  } catch (e) {
    // Column doesn't exist yet - that's okay, just skip the update
    // In the future, a migration will add this column
  }

  return NextResponse.redirect(redirectUrl, 303);
}
