import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const redirectUrl = new URL(`/music/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const post = await db
    .prepare('SELECT author_user_id FROM music_posts WHERE id = ?')
    .bind(id)
    .first();

  if (!post) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const isAdmin = isAdminUser(user);
  const canToggle = post.author_user_id === user.id || isAdmin;
  if (!canToggle) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const hidden = String(formData.get('hidden') || '').trim() === '1' ? 1 : 0;

  try {
    await db
      .prepare('UPDATE music_posts SET is_hidden = ?, updated_at = ? WHERE id = ?')
      .bind(hidden, Date.now(), id)
      .run();
    if (isAdmin) {
      await logAdminAction({
        adminUserId: user.id,
        actionType: 'toggle_hidden',
        targetType: 'music_post',
        targetId: id,
        metadata: { hidden: hidden === 1 }
      });
    }
  } catch (e) {
    console.error('Error updating music post hidden status (column may not exist yet):', e);
  }

  return NextResponse.redirect(redirectUrl, 303);
}
