import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { isAdminUser } from '../../../../lib/admin';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../../lib/uploads';
import { isImageUploadsEnabled } from '../../../../lib/settings';
import { logAdminAction } from '../../../../lib/audit';

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const log = await db
    .prepare(
      `SELECT dev_logs.id, dev_logs.title, dev_logs.body, dev_logs.image_key,
              dev_logs.is_locked,
              dev_logs.created_at, dev_logs.updated_at,
              users.username AS author_name
       FROM dev_logs
       JOIN users ON users.id = dev_logs.author_user_id
       WHERE dev_logs.id = ?`
    )
    .bind(params.id)
    .first();

  if (!log) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(log);
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const redirectUrl = new URL(`/devlog/${params.id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const existing = await db
    .prepare('SELECT author_user_id FROM dev_logs WHERE id = ?')
    .bind(params.id)
    .first();
  const imageUploadsEnabled = await isImageUploadsEnabled(db);

  if (!existing) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (existing.author_user_id !== user.id && !isAdminUser(user)) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const githubUrl = String(formData.get('github_url') || '').trim() || null;
  const demoUrl = String(formData.get('demo_url') || '').trim() || null;
  const links = String(formData.get('links') || '').trim() || null;

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
    imageKey = buildImageKey('devlog', imageFile.name || 'image');
    await bucket.put(imageKey, await imageFile.arrayBuffer(), {
      httpMetadata: { contentType: imageFile.type }
    });
  }

  if (imageKey) {
    try {
      await db
        .prepare('UPDATE dev_logs SET title = ?, body = ?, image_key = ?, github_url = ?, demo_url = ?, links = ?, updated_at = ? WHERE id = ?')
        .bind(title, body, imageKey, githubUrl, demoUrl, links, Date.now(), params.id)
        .run();
    } catch (e) {
      await db
        .prepare('UPDATE dev_logs SET title = ?, body = ?, image_key = ?, updated_at = ? WHERE id = ?')
        .bind(title, body, imageKey, Date.now(), params.id)
        .run();
    }
  } else {
    try {
      await db
        .prepare('UPDATE dev_logs SET title = ?, body = ?, github_url = ?, demo_url = ?, links = ?, updated_at = ? WHERE id = ?')
        .bind(title, body, githubUrl, demoUrl, links, Date.now(), params.id)
        .run();
    } catch (e) {
      await db
        .prepare('UPDATE dev_logs SET title = ?, body = ?, updated_at = ? WHERE id = ?')
        .bind(title, body, Date.now(), params.id)
        .run();
    }
  }

  if (isAdminUser(user)) {
    await logAdminAction({
      adminUserId: user.id,
      actionType: 'edit_post',
      targetType: 'dev_log',
      targetId: params.id
    });
  }

  return NextResponse.redirect(redirectUrl, 303);
}
