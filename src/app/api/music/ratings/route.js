import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export async function POST(request) {
  const user = await getSessionUser();
  const formData = await request.formData();
  const postId = String(formData.get('post_id') || '').trim();
  const rating = Number(formData.get('rating'));
  const redirectUrl = new URL(`/music/${postId}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!postId || Number.isNaN(rating) || rating < 1 || rating > 5) {
    redirectUrl.searchParams.set('error', 'invalid');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO music_ratings (id, post_id, user_id, rating, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, post_id) DO UPDATE SET rating = excluded.rating, created_at = excluded.created_at`
    )
    .bind(crypto.randomUUID(), postId, user.id, rating, Date.now())
    .run();

  return NextResponse.redirect(redirectUrl, 303);
}
