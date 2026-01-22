import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export async function POST(request) {
  const user = await getSessionUser();
  const formData = await request.formData();
  const postId = String(formData.get('post_id') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const redirectUrl = new URL(`/music/${postId}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!postId || !body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  
  // Check if music post is locked (rollout-safe)
  try {
    const post = await db
      .prepare('SELECT is_locked FROM music_posts WHERE id = ?')
      .bind(postId)
      .first();
    if (post && post.is_locked) {
      redirectUrl.searchParams.set('error', 'locked');
      return NextResponse.redirect(redirectUrl, 303);
    }
  } catch (e) {
    // Column might not exist yet, that's okay - allow posting
  }
  
  await db
    .prepare(
      'INSERT INTO music_comments (id, post_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), postId, user.id, body, Date.now())
    .run();

  return NextResponse.redirect(redirectUrl, 303);
}
