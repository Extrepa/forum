import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser, isModUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const post = await db
    .prepare('SELECT author_user_id FROM music_posts WHERE id = ?')
    .bind(id)
    .first();

  if (!post) {
    return NextResponse.json({ error: 'notfound' }, { status: 404 });
  }

  const isAdmin = isAdminUser(user);
  const canDelete = post.author_user_id === user.id || isModUser(user);
  if (!canDelete) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  try {
    await db
      .prepare('UPDATE music_posts SET is_deleted = 1, updated_at = ? WHERE id = ?')
      .bind(Date.now(), id)
      .run();
  } catch (e) {
    // Some deployed schemas do not have music_posts.updated_at yet.
    // Fall back to soft-delete only so delete remains functional.
    try {
      await db
        .prepare('UPDATE music_posts SET is_deleted = 1 WHERE id = ?')
        .bind(id)
        .run();
    } catch (fallbackError) {
      return NextResponse.json({ error: 'notready' }, { status: 409 });
    }
  }

  if (isAdmin) {
    await logAdminAction({
      adminUserId: user.id,
      actionType: 'delete_post',
      targetType: 'music_post',
      targetId: id
    });
  }

  return NextResponse.json({ ok: true });
}
