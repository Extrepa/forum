import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { isAdminUser } from '../../../lib/admin';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../lib/uploads';

export async function POST(request) {
  const user = await getSessionUser();
  const redirectUrl = new URL('/announcements', request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!isAdminUser(user)) {
    redirectUrl.searchParams.set('error', 'admin_required');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();

  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formImage = formData.get('image');
  const imageFile = formImage && typeof formImage === 'object' && 'arrayBuffer' in formImage ? formImage : null;
  const validation = imageFile ? isAllowedImage(imageFile) : { ok: true };
  if (!validation.ok) {
    redirectUrl.searchParams.set('error', validation.reason);
    return NextResponse.redirect(redirectUrl, 303);
  }

  let imageKey = null;
  if (imageFile && imageFile.size > 0) {
    const { env } = await getCloudflareContext({ async: true });
    if (!canUploadImages(user, env)) {
      redirectUrl.searchParams.set('error', 'upload');
      return NextResponse.redirect(redirectUrl, 303);
    }
    const bucket = await getUploadsBucket();
    imageKey = buildImageKey('timeline-updates', imageFile.name || 'image');
    await bucket.put(imageKey, await imageFile.arrayBuffer(), {
      httpMetadata: { contentType: imageFile.type }
    });
  }

  const db = await getDb();
  await db
    .prepare(
      'INSERT INTO timeline_updates (id, author_user_id, title, body, created_at, image_key) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), user.id, title, body, Date.now(), imageKey)
    .run();

  return NextResponse.redirect(redirectUrl, 303);
}
