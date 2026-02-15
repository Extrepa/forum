import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { isAdminUser } from '../../../../lib/admin';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../../lib/uploads';
import { createMentionNotifications } from '../../../../lib/mentions';
import { isImageUploadsEnabled } from '../../../../lib/settings';
import { isValidPostType, postTypeCollectionPath, postTypePath } from '../../../../lib/contentTypes';
import { logAdminAction } from '../../../../lib/audit';
import { canViewScope, normalizeVisibilityScope } from '../../../../lib/visibility';
import { isDripNomadUser } from '../../../../lib/roles';

function normalizeType(raw) {
  return String(raw || '').trim().toLowerCase();
}

export async function GET(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const db = await getDb();

  try {
    const row = await db
      .prepare(
        `SELECT posts.id, posts.type, posts.title, posts.body, posts.image_key, posts.is_private,
                COALESCE(posts.visibility_scope, 'members') AS visibility_scope,
                posts.created_at, posts.updated_at,
                users.username AS author_name
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.id = ?`
      )
      .bind(id)
      .first();

    if (!row) {
      return NextResponse.json({ error: 'notfound' }, { status: 404 });
    }
    if (!canViewScope(user, row.visibility_scope)) {
      return NextResponse.json({ error: 'notfound' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (e) {
    return NextResponse.json({ error: 'notready' }, { status: 409 });
  }
}

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const redirectUrl = new URL('/', request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  let existing = null;
  try {
    existing = await db
      .prepare("SELECT id, type, author_user_id, image_key, COALESCE(visibility_scope, 'members') AS visibility_scope, COALESCE(section_scope, 'default') AS section_scope FROM posts WHERE id = ?")
      .bind(id)
      .first();
  } catch (e) {
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!existing) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const imageUploadsEnabled = await isImageUploadsEnabled(db);

  const type = normalizeType(existing.type);
  if (!isValidPostType(type)) {
    redirectUrl.searchParams.set('error', 'invalid_type');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const isOwner = existing.author_user_id === user.id;
  if (!isOwner && !isAdminUser(user)) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const isPrivate = String(formData.get('is_private') || '').trim() === '1' ? 1 : 0;
  const requestedNomadVisibility = String(formData.get('visibility_scope_nomads') || '').trim() === '1';
  const userCanUseNomadScope = isDripNomadUser(user);
  if (requestedNomadVisibility && !userCanUseNomadScope) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }
  const sectionScope = (type === 'nomads' || requestedNomadVisibility || existing.section_scope === 'nomads') ? 'nomads' : 'default';
  if (sectionScope === 'nomads' && !userCanUseNomadScope) {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }
  const visibilityScope = normalizeVisibilityScope(sectionScope === 'nomads' ? 'nomads' : 'members', {
    allowNomads: userCanUseNomadScope,
  });
  const sectionPath = sectionScope === 'nomads' ? '/nomads' : (postTypeCollectionPath(type) || postTypePath(type));
  redirectUrl.pathname = `${sectionPath}/${existing.id}`;
  if (type === 'nomads' && !userCanUseNomadScope) {
    redirectUrl.searchParams.set('error', 'unauthorized');
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
      .prepare('UPDATE posts SET title = ?, body = ?, image_key = ?, is_private = ?, visibility_scope = ?, section_scope = ?, updated_at = ? WHERE id = ?')
      .bind(finalTitle, body || null, imageKey, isPrivate, visibilityScope, sectionScope, Date.now(), id)
      .run();
  } catch (e) {
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (isAdminUser(user) && existing.author_user_id !== user.id) {
    await logAdminAction({
      adminUserId: user.id,
      actionType: 'edit_post',
      targetType: 'post',
      targetId: id
    });
  }

  return NextResponse.redirect(redirectUrl, 303);
}
