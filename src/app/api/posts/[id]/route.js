import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { isAdminUser } from '../../../../lib/admin';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../../lib/uploads';

function normalizeType(raw) {
  return String(raw || '').trim().toLowerCase();
}

function isValidType(type) {
  return ['art', 'bugs', 'rant', 'nostalgia', 'lore', 'memories', 'about'].includes(type);
}

function pagePathForType(type) {
  return `/${type === 'about' ? 'about' : type}`;
}

export async function GET(request, { params }) {
  const user = await getSessionUser();
  const includePrivate = !!user;
  const db = await getDb();

  try {
    const row = await db
      .prepare(
        `SELECT posts.id, posts.type, posts.title, posts.body, posts.image_key, posts.is_private,
                posts.created_at, posts.updated_at,
                users.username AS author_name
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.id = ?`
      )
      .bind(params.id)
      .first();

    if (!row) {
      return NextResponse.json({ error: 'notfound' }, { status: 404 });
    }
    if (!user && (row.type === 'lore' || row.type === 'memories')) {
      return NextResponse.json({ error: 'notfound' }, { status: 404 });
    }
    if (!includePrivate && row.is_private) {
      return NextResponse.json({ error: 'notfound' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (e) {
    return NextResponse.json({ error: 'notready' }, { status: 409 });
  }
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const redirectUrl = new URL('/', request.url);

  if (!user) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }
  if (user.must_change_password || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'password');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  let existing = null;
  try {
    existing = await db.prepare('SELECT id, type, author_user_id, image_key FROM posts WHERE id = ?').bind(params.id).first();
  } catch (e) {
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!existing) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const type = normalizeType(existing.type);
  if (!isValidType(type)) {
    redirectUrl.searchParams.set('error', 'invalid_type');
    return NextResponse.redirect(redirectUrl, 303);
  }

  redirectUrl.pathname = `${pagePathForType(type)}/${existing.id}`;

  const isOwner = existing.author_user_id === user.id;
  if (!isOwner && !isAdminUser(user)) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const isPrivate = String(formData.get('is_private') || '').trim() === '1' ? 1 : 0;

  const formImage = formData.get('image');
  const imageFile = formImage && typeof formImage === 'object' && 'arrayBuffer' in formImage ? formImage : null;
  const validation = imageFile ? isAllowedImage(imageFile) : { ok: true };
  if (!validation.ok) {
    redirectUrl.searchParams.set('error', validation.reason);
    return NextResponse.redirect(redirectUrl, 303);
  }

  let imageKey = existing.image_key || null;
  if (imageFile && imageFile.size > 0) {
    const { env } = await getCloudflareContext({ async: true });
    if (!canUploadImages(user, env)) {
      redirectUrl.searchParams.set('error', 'upload');
      return NextResponse.redirect(redirectUrl, 303);
    }
    const bucket = await getUploadsBucket();
    imageKey = buildImageKey(`posts-${type}`, imageFile.name || 'image');
    await bucket.put(imageKey, await imageFile.arrayBuffer(), {
      httpMetadata: { contentType: imageFile.type }
    });
  }

  // Art requires an image to exist (either old or newly uploaded).
  if (type === 'art' && !imageKey) {
    redirectUrl.searchParams.set('error', 'missing_image');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const finalTitle = title || (type === 'bugs' ? 'Bug report' : 'Untitled');

  try {
    await db
      .prepare('UPDATE posts SET title = ?, body = ?, image_key = ?, is_private = ?, updated_at = ? WHERE id = ?')
      .bind(finalTitle, body || null, imageKey, isPrivate, Date.now(), params.id)
      .run();
  } catch (e) {
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  return NextResponse.redirect(redirectUrl, 303);
}

