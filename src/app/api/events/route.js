import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';

export async function POST(request) {
  const user = await getSessionUser();
  const redirectUrl = new URL('/events', request.url);

  if (!user) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const startsAtRaw = String(formData.get('starts_at') || '').trim();
  const startsAt = Date.parse(startsAtRaw);

  if (!title || Number.isNaN(startsAt)) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Reject image uploads in events - images are only allowed in shitposts
  const formImage = formData.get('image');
  const imageFile = formImage && typeof formImage === 'object' && 'arrayBuffer' in formImage ? formImage : null;
  if (imageFile && imageFile.size > 0) {
    redirectUrl.searchParams.set('error', 'upload');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  await db
    .prepare(
      'INSERT INTO events (id, author_user_id, title, details, starts_at, created_at, image_key) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), user.id, title, body || null, startsAt, Date.now(), null)
    .run();

  return NextResponse.redirect(redirectUrl, 303);
}
