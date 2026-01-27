import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../lib/uploads';
import { createMentionNotifications } from '../../../lib/mentions';

function normalizeType(raw) {
  return String(raw || '').trim().toLowerCase();
}

function isValidType(type) {
  return ['art', 'bugs', 'rant', 'nostalgia', 'lore', 'memories', 'about'].includes(type);
}

export async function GET(request) {
  const user = await getSessionUser();
  const url = new URL(request.url);
  const type = normalizeType(url.searchParams.get('type'));
  const includePrivate = !!user;

  if (!isValidType(type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }

  if ((type === 'lore' || type === 'memories') && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  try {
    const out = await db
      .prepare(
        `SELECT posts.id, posts.type, posts.title, posts.body, posts.image_key, posts.is_private,
                posts.created_at, posts.updated_at,
                users.username AS author_name
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.type = ?
           AND (${includePrivate ? '1=1' : 'posts.is_private = 0'})
         ORDER BY posts.created_at DESC
         LIMIT 50`
      )
      .bind(type)
      .all();
    return NextResponse.json(out?.results || []);
  } catch (e) {
    // Rollout compatibility if table isn't migrated yet.
    return NextResponse.json({ error: 'notready' }, { status: 409 });
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  const redirectUrl = new URL('/', request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const type = normalizeType(formData.get('type'));
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const isPrivate = String(formData.get('is_private') || '').trim() === '1' ? 1 : 0;

  if (!isValidType(type)) {
    redirectUrl.searchParams.set('error', 'invalid_type');
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Map post types to their section URLs
  const typeToPath = {
    'bugs': '/bugs-rant',
    'rant': '/bugs-rant',
    'art': '/art-nostalgia',
    'nostalgia': '/art-nostalgia',
    'lore': '/lore-memories',
    'memories': '/lore-memories',
    'about': '/about'
  };
  redirectUrl.pathname = typeToPath[type] || `/${type}`;

  // Lore/Memories can have empty title; others default.
  const finalTitle = title || (type === 'bugs' ? 'Bug report' : type === 'art' ? 'Untitled' : 'Untitled');
  if (!body && type !== 'art') {
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

  // Art requires an image.
  if (type === 'art' && (!imageFile || imageFile.size <= 0)) {
    redirectUrl.searchParams.set('error', 'missing_image');
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
    imageKey = buildImageKey(`posts-${type}`, imageFile.name || 'image');
    await bucket.put(imageKey, await imageFile.arrayBuffer(), {
      httpMetadata: { contentType: imageFile.type }
    });
  }

  const db = await getDb();
  const postId = crypto.randomUUID();
  try {
    await db
      .prepare(
        `INSERT INTO posts (id, author_user_id, type, title, body, image_key, is_private, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(postId, user.id, type, finalTitle, body || null, imageKey, isPrivate, Date.now())
      .run();

    // Create mention notifications
    await createMentionNotifications({
      text: body,
      actorId: user.id,
      targetType: type === 'about' ? 'about' : type,
      targetId: postId,
      requestUrl: request.url
    });
  } catch (e) {
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  return NextResponse.redirect(redirectUrl, 303);
}

