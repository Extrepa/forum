import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../../lib/uploads';
import { safeEmbedFromUrl } from '../../../../lib/embeds';
import { isImageUploadsEnabled } from '../../../../lib/settings';

export async function POST(request) {
  const user = await getSessionUser();
  const redirectUrl = new URL('/music', request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const imageUploadsEnabled = await isImageUploadsEnabled(db);

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const url = String(formData.get('url') || '').trim();
  const type = String(formData.get('type') || '').trim();
  const tags = String(formData.get('tags') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const embedStyle = String(formData.get('embed_style') || 'auto').trim();

  if (!title || !url || !type) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const embed = safeEmbedFromUrl(type, url, embedStyle);
  if (!embed) {
    redirectUrl.searchParams.set('error', 'invalid');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formImage = formData.get('image');
  const imageFile = formImage && typeof formImage === 'object' && 'arrayBuffer' in formImage ? formImage : null;
  if (imageFile && imageFile.size > 0 && !imageUploadsEnabled) {
    redirectUrl.searchParams.set('error', 'image_uploads_disabled');
    return NextResponse.redirect(redirectUrl, 303);
  }
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
    imageKey = buildImageKey('music', imageFile.name || 'image');
    await bucket.put(imageKey, await imageFile.arrayBuffer(), {
      httpMetadata: { contentType: imageFile.type }
    });
  }

  const db = await getDb();
  try {
    await db
      .prepare(
        'INSERT INTO music_posts (id, author_user_id, title, body, url, type, tags, image_key, embed_style, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        title,
        body || null,
        url,
        type,
        tags || null,
        imageKey,
        embedStyle || 'auto',
        Date.now()
      )
      .run();
  } catch (e) {
    // Rollout-safe: if embed_style column doesn't exist yet, use old query
    await db
      .prepare(
        'INSERT INTO music_posts (id, author_user_id, title, body, url, type, tags, image_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        title,
        body || null,
        url,
        type,
        tags || null,
        imageKey,
        Date.now()
      )
      .run();
  }

  return NextResponse.redirect(redirectUrl, 303);
}
