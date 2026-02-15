import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../lib/uploads';
import { createMentionNotifications } from '../../../lib/mentions';
import { isImageUploadsEnabled } from '../../../lib/settings';
import { notifyAdminsOfNewPost } from '../../../lib/adminNotifications';

export async function GET() {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT projects.id, projects.title, projects.description, projects.status,
              projects.github_url, projects.demo_url, projects.image_key,
              projects.created_at, projects.updated_at,
              users.username AS author_name
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       ORDER BY projects.created_at DESC
       LIMIT 50`
    )
    .all();

  return NextResponse.json(results);
}

export async function POST(request) {
  const user = await getSessionUser();
  const redirectUrl = new URL('/projects', request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }  

  const db = await getDb();
  const imageUploadsEnabled = await isImageUploadsEnabled(db);

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const status = String(formData.get('status') || '').trim();
  const githubUrl = String(formData.get('github_url') || '').trim() || null;
  const demoUrl = String(formData.get('demo_url') || '').trim() || null;
  const updatesEnabled = formData.get('updates_enabled') === 'on' ? 1 : 0;

  if (!title || !description || !status) {
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
    imageKey = buildImageKey('projects', imageFile.name || 'image');
    await bucket.put(imageKey, await imageFile.arrayBuffer(), {
      httpMetadata: { contentType: imageFile.type }
    });
  }

  const projectId = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare(
      'INSERT INTO projects (id, author_user_id, title, description, status, github_url, demo_url, image_key, created_at, updates_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(projectId, user.id, title, description, status, githubUrl, demoUrl, imageKey, now, updatesEnabled)
    .run();

  // Create mention notifications
  await createMentionNotifications({
    text: description,
    actorId: user.id,
    targetType: 'project',
    targetId: projectId,
    requestUrl: request.url
  });

  await notifyAdminsOfNewPost({
    db,
    actorUser: user,
    targetType: 'project',
    targetId: projectId,
    createdAt: now
  });

  return NextResponse.redirect(redirectUrl, 303);
}
