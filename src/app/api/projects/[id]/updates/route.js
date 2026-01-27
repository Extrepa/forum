import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../../../lib/uploads';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const redirectUrl = new URL(`/projects/${params.id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const existing = await db
    .prepare('SELECT author_user_id FROM projects WHERE id = ?')
    .bind(params.id)
    .first();

  if (!existing) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (existing.author_user_id !== user.id) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();

  if (!title || !body) {
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
    imageKey = buildImageKey('project-updates', imageFile.name || 'image');
    await bucket.put(imageKey, await imageFile.arrayBuffer(), {
      httpMetadata: { contentType: imageFile.type }
    });
  }

  const now = Date.now();
  await db
    .prepare(
      'INSERT INTO project_updates (id, project_id, author_user_id, title, body, image_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), params.id, user.id, title, body, imageKey, now)
    .run();

  // Notify participants (commenters) about the project update
  try {
    const { results: participants } = await db
      .prepare(`
        SELECT DISTINCT pc.author_user_id, u.notify_update_enabled 
        FROM project_comments pc
        JOIN users u ON u.id = pc.author_user_id
        WHERE pc.project_id = ? AND pc.is_deleted = 0
      `)
      .bind(params.id)
      .all();

    const recipients = new Set();
    for (const row of participants || []) {
      if (row?.author_user_id && row.notify_update_enabled !== 0) {
        recipients.add(row.author_user_id);
      }
    }
    recipients.delete(user.id);

    for (const recipientUserId of recipients) {
      await db
        .prepare(
          'INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          crypto.randomUUID(),
          recipientUserId,
          user.id,
          'update',
          'project',
          params.id,
          now
        )
        .run();
    }
  } catch (e) {
    // Ignore notification failures
  }

  return NextResponse.redirect(redirectUrl, 303);
}
