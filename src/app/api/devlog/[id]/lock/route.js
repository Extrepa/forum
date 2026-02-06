import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUserWithRole, isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUserWithRole();
  const redirectUrl = new URL(`/devlog/${id}`, request.url);

  if (!user || !isAdminUser(user)) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const locked = String(formData.get('locked') || '').trim() === '1' ? 1 : 0;

  const db = await getDb();
  await db
    .prepare('UPDATE dev_logs SET is_locked = ?, updated_at = ? WHERE id = ?')
    .bind(locked, Date.now(), id)
    .run();
  await logAdminAction({
    adminUserId: user.id,
    actionType: 'toggle_lock',
    targetType: 'dev_log',
    targetId: id,
    metadata: { locked: locked === 1 }
  });

  return NextResponse.redirect(redirectUrl, 303);
}
