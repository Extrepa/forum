import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { isAdminUser } from '../../../../lib/admin';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../../lib/uploads';

export async function GET(request, { params }) {
  const db = await getDb();
  const project = await db
    .prepare(
      `SELECT projects.id, projects.title, projects.description, projects.status,
              projects.github_url, projects.demo_url, projects.image_key,
              projects.created_at, projects.updated_at,
              users.username AS author_name
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       WHERE projects.id = ?`
    )
    .bind(params.id)
    .first();

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

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

  if (existing.author_user_id !== user.id && !isAdminUser(user)) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

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

  if (imageKey) {
    await db
      .prepare(
        'UPDATE projects SET title = ?, description = ?, status = ?, github_url = ?, demo_url = ?, image_key = ?, updates_enabled = ?, updated_at = ? WHERE id = ?'
      )
      .bind(title, description, status, githubUrl, demoUrl, imageKey, updatesEnabled, Date.now(), params.id)
      .run();
  } else {
    await db
      .prepare(
        'UPDATE projects SET title = ?, description = ?, status = ?, github_url = ?, demo_url = ?, updates_enabled = ?, updated_at = ? WHERE id = ?'
      )
      .bind(title, description, status, githubUrl, demoUrl, updatesEnabled, Date.now(), params.id)
      .run();
  }

  return NextResponse.redirect(redirectUrl, 303);
}
