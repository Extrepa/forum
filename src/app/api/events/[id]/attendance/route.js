import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const redirectUrl = new URL(`/events/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!isAdminUser(user)) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const reopened = String(formData.get('reopened') || '').trim() === '1' ? 1 : 0;

  const db = await getDb();
  const event = await db
    .prepare('SELECT id FROM events WHERE id = ?')
    .bind(id)
    .first();

  if (!event) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  try {
    await db
      .prepare('UPDATE events SET attendance_reopened = ? WHERE id = ?')
      .bind(reopened, id)
      .run();

    await logAdminAction({
      adminUserId: user.id,
      actionType: 'toggle_attendance_reopen',
      targetType: 'event',
      targetId: id,
      metadata: { reopened: reopened === 1 }
    });
  } catch (e) {
    // Rollout-safe for older schemas
  }

  return NextResponse.redirect(redirectUrl, 303);
}
