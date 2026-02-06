import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const redirectUrl = new URL(`/lobby/${id}`, request.url);

  if (!user) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  
  // Get thread to check ownership
  const thread = await db
    .prepare('SELECT author_user_id FROM forum_threads WHERE id = ?')
    .bind(id)
    .first();

  if (!thread) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const isAdmin = isAdminUser(user);
  const canEdit = thread.author_user_id === user.id || isAdmin;

  if (!canEdit) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();

  if (!title || !body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Update thread
  await db
    .prepare('UPDATE forum_threads SET title = ?, body = ?, updated_at = ? WHERE id = ?')
    .bind(title, body, Date.now(), id)
    .run();
  if (isAdmin) {
    await logAdminAction({
      adminUserId: user.id,
      actionType: 'edit_post',
      targetType: 'forum_thread',
      targetId: id
    });
  }

  return NextResponse.redirect(redirectUrl, 303);
}
