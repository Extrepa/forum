import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../lib/uploads';
import { createMentionNotifications } from '../../../lib/mentions';
import { isImageUploadsEnabled } from '../../../lib/settings';
import { notifyAdminsOfNewPost } from '../../../lib/adminNotifications';

export async function POST(request) {
  const user = await getSessionUser();
  const redirectUrl = new URL('/lobby', request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const imageUploadsEnabled = await isImageUploadsEnabled(db);

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();

  if (!title || !body) {
    redirectUrl.searchParams.set('error', 'missing');
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
    imageKey = buildImageKey('forum-threads', imageFile.name || 'image');
    await bucket.put(imageKey, await imageFile.arrayBuffer(), {
      httpMetadata: { contentType: imageFile.type }
    });
  }

  const threadId = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare('INSERT INTO forum_threads (id, author_user_id, title, body, created_at, image_key) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(threadId, user.id, title, body, now, imageKey)
    .run();

  await createMentionNotifications({
    text: body,
    actorId: user.id,
    targetType: 'forum_thread',
        targetId: threadId,
    requestUrl: request.url
  });

  await notifyAdminsOfNewPost({
    db,
    actorUser: user,
    targetType: 'forum_thread',
    targetId: threadId,
    createdAt: now
  });

  return NextResponse.redirect(redirectUrl, 303);
}
