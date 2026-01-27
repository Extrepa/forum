import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../lib/uploads';
import { parseLocalDateTimeToUTC } from '../../../lib/dates';
import { createMentionNotifications } from '../../../lib/mentions';

export async function POST(request) {
  const user = await getSessionUser();
  const redirectUrl = new URL('/events', request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const startsAtRaw = String(formData.get('starts_at') || '').trim();
  const startsAt = parseLocalDateTimeToUTC(startsAtRaw);

  if (!title || !startsAt) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Handle image upload for events
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
    imageKey = buildImageKey('events', imageFile.name || 'image');
    await bucket.put(imageKey, await imageFile.arrayBuffer(), {
      httpMetadata: { contentType: imageFile.type }
    });
  }

  const db = await getDb();
  const eventId = crypto.randomUUID();
  await db
    .prepare(
      'INSERT INTO events (id, author_user_id, title, details, starts_at, created_at, image_key) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(eventId, user.id, title, body || null, startsAt, Date.now(), imageKey)
    .run();

  // Create mention notifications
  await createMentionNotifications({
    text: body,
    actorId: user.id,
    targetType: 'event',
    targetId: eventId,
    requestUrl: request.url
  });

  return NextResponse.redirect(redirectUrl, 303);
}
