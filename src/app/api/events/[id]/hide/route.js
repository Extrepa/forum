import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const redirectUrl = new URL(`/events/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const event = await db
    .prepare('SELECT author_user_id FROM events WHERE id = ?')
    .bind(id)
    .first();

  if (!event) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const isAdmin = isAdminUser(user);
  const canToggle = event.author_user_id === user.id || isAdmin;
  if (!canToggle) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const hidden = String(formData.get('hidden') || '').trim() === '1' ? 1 : 0;

  try {
    await db
      .prepare('UPDATE events SET is_hidden = ?, updated_at = ? WHERE id = ?')
      .bind(hidden, Date.now(), id)
      .run();
  } catch (e) {
    console.error('Error updating event hidden status (column may not exist yet):', e);
  }

  return NextResponse.redirect(redirectUrl, 303);
}
