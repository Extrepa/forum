import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  // Next.js 15: params is a Promise, must await
  const { id } = await params;
  
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  
  // Get post to check ownership and type
  const post = await db
    .prepare('SELECT author_user_id, type FROM posts WHERE id = ?')
    .bind(id)
    .first();

  if (!post) {
    return NextResponse.json({ error: 'notfound' }, { status: 404 });
  }

  const isAdmin = isAdminUser(user);
  const canDelete = post.author_user_id === user.id || isAdmin;

  if (!canDelete) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  // Soft delete post (set is_deleted = 1 if column exists, otherwise we might need a different approach)
  // For now, we'll try to update is_deleted, and if that fails, we could delete the row
  try {
    await db
      .prepare('UPDATE posts SET is_deleted = 1, updated_at = ? WHERE id = ?')
      .bind(Date.now(), id)
      .run();
  } catch (e) {
    // If is_deleted column doesn't exist, we might need to actually delete
    // But for now, just return error - migration should add is_deleted
    return NextResponse.json({ error: 'notready' }, { status: 409 });
  }

  if (isAdmin) {
    await logAdminAction({
      adminUserId: user.id,
      actionType: 'delete_post',
      targetType: 'post',
      targetId: id
    });
  }

  return NextResponse.json({ ok: true });
}
