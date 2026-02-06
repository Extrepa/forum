import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { logAdminAction } from '../../../../../lib/audit';

function redirectPathForType(type, id) {
  if (type === 'lore') return `/lore/${id}`;
  if (type === 'memories') return `/memories/${id}`;
  if (type === 'lore-memories') return `/lore-memories/${id}`;
  if (type === 'art') return `/art/${id}`;
  if (type === 'nostalgia') return `/nostalgia/${id}`;
  if (type === 'bugs') return `/bugs/${id}`;
  if (type === 'rant') return `/rant/${id}`;
  return `/posts/${id}`;
}

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();

  const db = await getDb();
  const post = await db
    .prepare('SELECT type, author_user_id FROM posts WHERE id = ?')
    .bind(id)
    .first();

  if (!post) {
    return NextResponse.json({ error: 'notfound' }, { status: 404 });
  }

  const redirectUrl = new URL(redirectPathForType(post.type, id), request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
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
      .prepare('UPDATE posts SET is_hidden = ?, updated_at = ? WHERE id = ?')
      .bind(hidden, Date.now(), id)
      .run();
    if (isAdmin) {
      await logAdminAction({
        adminUserId: user.id,
        actionType: 'toggle_hidden',
        targetType: 'post',
        targetId: id,
        metadata: { hidden: hidden === 1 }
      });
    }
  } catch (e) {
    console.error('Error updating post hidden status (column may not exist yet):', e);
  }

  return NextResponse.redirect(redirectUrl, 303);
}
