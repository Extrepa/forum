import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const redirectUrl = new URL(`/lobby/${params.id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const locked = String(formData.get('locked') || '').trim() === '1' ? 1 : 0;

  const db = await getDb();
  const thread = await db
    .prepare('SELECT author_user_id FROM forum_threads WHERE id = ?')
    .bind(params.id)
    .first();

  if (!thread) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const canToggle = thread.author_user_id === user.id || user.role === 'admin';
  if (!canToggle) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  await db
    .prepare('UPDATE forum_threads SET is_locked = ?, updated_at = ? WHERE id = ?')
    .bind(locked, Date.now(), params.id)
    .run();

  return NextResponse.redirect(redirectUrl, 303);
}

