import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../lib/db';
import { getSessionUserWithRole, isAdminUser } from '../../../lib/admin';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../lib/uploads';

export async function GET(request) {
  const user = await getSessionUserWithRole();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT dev_logs.id, dev_logs.title, dev_logs.body, dev_logs.image_key,
              dev_logs.is_locked,
              dev_logs.created_at, dev_logs.updated_at,
              users.username AS author_name,
              (SELECT COUNT(*) FROM dev_log_comments WHERE dev_log_comments.log_id = dev_logs.id AND dev_log_comments.is_deleted = 0) AS comment_count
       FROM dev_logs
       JOIN users ON users.id = dev_logs.author_user_id
       ORDER BY dev_logs.created_at DESC
       LIMIT 50`
    )
    .all();

  return NextResponse.json(results);
}

export async function POST(request) {
  const user = await getSessionUserWithRole();
  const redirectUrl = new URL('/devlog', request.url);

  if (!user || !isAdminUser(user)) {
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

  const db = await getDb();
  try {
    await db
      .prepare(
        'INSERT INTO dev_logs (id, author_user_id, title, body, image_key, github_url, demo_url, links, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(crypto.randomUUID(), user.id, title, body, imageKey, githubUrl, demoUrl, links, Date.now())
      .run();
  } catch (e) {
    // Rollout compatibility if columns aren't migrated yet.
    await db
      .prepare('INSERT INTO dev_logs (id, author_user_id, title, body, image_key, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), user.id, title, body, imageKey, Date.now())
      .run();
  }

  return NextResponse.redirect(redirectUrl, 303);
}

