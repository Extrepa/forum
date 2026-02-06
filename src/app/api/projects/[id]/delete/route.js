import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const project = await db
    .prepare('SELECT author_user_id FROM projects WHERE id = ?')
    .bind(id)
    .first();

  if (!project) {
    return NextResponse.json({ error: 'notfound' }, { status: 404 });
  }

  const isAdmin = isAdminUser(user);
  const canDelete = project.author_user_id === user.id || isAdmin;
  if (!canDelete) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  try {
    await db
      .prepare('UPDATE projects SET is_deleted = 1, updated_at = ? WHERE id = ?')
      .bind(Date.now(), id)
      .run();
  } catch (e) {
    return NextResponse.json({ error: 'notready' }, { status: 409 });
  }

  if (isAdmin) {
    await logAdminAction({
      adminUserId: user.id,
      actionType: 'delete_post',
      targetType: 'project',
      targetId: id
    });
  }

  return NextResponse.json({ ok: true });
}
