import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../../lib/db';
import { getSessionUser } from '../../../../../../../lib/auth';
import { isAdminUser, isModUser } from '../../../../../../../lib/admin';

export async function POST(request, { params }) {
  const { id, replyId } = await params;
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = await getDb();

  const reply = await db
    .prepare('SELECT author_user_id FROM forum_replies WHERE id = ? AND thread_id = ?')
    .bind(replyId, id)
    .first();

  if (!reply) {
    return NextResponse.json({ error: 'notfound' }, { status: 404 });
  }

  const isAdmin = isAdminUser(user);
  const canDelete = reply.author_user_id === user.id || isModUser(user);

  if (!canDelete) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  await db
    .prepare('UPDATE forum_replies SET is_deleted = 1, updated_at = ? WHERE id = ?')
    .bind(Date.now(), replyId)
    .run();

  return NextResponse.json({ ok: true });
}
