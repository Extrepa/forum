import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';

export async function POST(request) {
  const user = await getSessionUser();
  const redirectUrl = new URL('/timeline', request.url);

  if (!user) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }
  if (user.must_change_password || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'password');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();

  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Reject image uploads in timeline - images are only allowed in shitposts
  const formImage = formData.get('image');
  const imageFile = formImage && typeof formImage === 'object' && 'arrayBuffer' in formImage ? formImage : null;
  if (imageFile && imageFile.size > 0) {
    redirectUrl.searchParams.set('error', 'upload');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  await db
    .prepare(
      'INSERT INTO timeline_updates (id, author_user_id, title, body, created_at, image_key) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), user.id, title, body, Date.now(), null)
    .run();

  return NextResponse.redirect(redirectUrl, 303);
}
