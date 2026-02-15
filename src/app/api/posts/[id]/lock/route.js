import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  
  // Get the post to determine redirect URL
  const db = await getDb();
  const post = await db
    .prepare('SELECT type FROM posts WHERE id = ?')
    .bind(id)
    .first();

  if (!post) {
    return NextResponse.json({ error: 'notfound' }, { status: 404 });
  }

  // Determine redirect URL based on post type
  let redirectPath = '/';
  if (post.type === 'lore') redirectPath = `/lore/${id}`;
  else if (post.type === 'memories') redirectPath = `/memories/${id}`;
  else if (post.type === 'lore-memories') redirectPath = `/lore-memories/${id}`;
  else if (post.type === 'art') redirectPath = `/art/${id}`;
  else if (post.type === 'nostalgia') redirectPath = `/nostalgia/${id}`;
  else if (post.type === 'bugs') redirectPath = `/bugs/${id}`;
  else if (post.type === 'rant') redirectPath = `/rant/${id}`;
  else if (post.type === 'nomads') redirectPath = `/nomads/${id}`;
  
  const redirectUrl = new URL(redirectPath, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const locked = String(formData.get('locked') || '').trim() === '1' ? 1 : 0;

  const postAuthor = await db
    .prepare('SELECT author_user_id FROM posts WHERE id = ?')
    .bind(id)
    .first();

  if (!postAuthor) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const isAdmin = isAdminUser(user);
  const canToggle = postAuthor.author_user_id === user.id || isAdmin;
  if (!canToggle) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Rollout-safe: try to update is_locked, fall back gracefully if column doesn't exist
  try {
    await db
      .prepare('UPDATE posts SET is_locked = ?, updated_at = ? WHERE id = ?')
      .bind(locked, Date.now(), id)
      .run();
    if (isAdmin) {
      await logAdminAction({
        adminUserId: user.id,
        actionType: 'toggle_lock',
        targetType: 'post',
        targetId: id,
        metadata: { locked: locked === 1 }
      });
    }
  } catch (e) {
    // Column might not exist yet - that's okay, migration will add it
    console.error('Error updating post lock status (column may not exist yet):', e);
  }

  return NextResponse.redirect(redirectUrl, 303);
}
