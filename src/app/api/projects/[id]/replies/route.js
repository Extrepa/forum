import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage } from '../../../../../lib/uploads';
import { createMentionNotifications } from '../../../../../lib/mentions';
import { sendOutboundNotification } from '../../../../../lib/outboundNotifications';
import { isImageUploadsEnabled } from '../../../../../lib/settings';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
  const replyToIdRaw = String(formData.get('reply_to_id') || '').trim();
  const replyToId = replyToIdRaw ? replyToIdRaw : null;

  const redirectUrl = new URL(`/projects/${id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Handle image upload
  const formImage = formData.get('image');
  // Check if image is actually a File object with content
  const imageFile = formImage && 
                    typeof formImage === 'object' && 
                    'arrayBuffer' in formImage &&
                    'size' in formImage &&
                    formImage.size > 0 
                    ? formImage : null;
  if (imageFile && imageFile.size > 0 && !imageUploadsEnabled) {
    redirectUrl.searchParams.set('error', 'image_uploads_disabled');
    return NextResponse.redirect(redirectUrl, 303);
  }
  
  const validation = imageFile ? isAllowedImage(imageFile) : { ok: true };

  if (!validation.ok) {
    redirectUrl.searchParams.set('error', validation.reason);
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Require either body text OR an image (or both)
  if (!body && !imageFile) {
    console.error('Project reply failed: both body and image are empty', { projectId: id, userId: user?.id });
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Normalize empty body to empty string (database allows empty strings)
  const finalBody = body || '';

  let imageKey = null;
  if (imageFile) {
    try {
      const { env } = await getCloudflareContext({ async: true });
      if (!canUploadImages(user, env)) {
        console.error('Image upload permission denied', { 
          username: user?.username, 
          hasAllowlist: !!env?.IMAGE_UPLOAD_ALLOWLIST,
          allowlistValue: env?.IMAGE_UPLOAD_ALLOWLIST 
        });
        redirectUrl.searchParams.set('error', 'upload_permission');
        return NextResponse.redirect(redirectUrl, 303);
      }
      const bucket = await getUploadsBucket();
      imageKey = buildImageKey('project-replies', imageFile.name || 'image');
      console.log('Uploading image to bucket', { imageKey, size: imageFile.size, type: imageFile.type });
      await bucket.put(imageKey, await imageFile.arrayBuffer(), {
        httpMetadata: { contentType: imageFile.type }
      });
      console.log('Image uploaded successfully', { imageKey });
    } catch (e) {
      // If image upload fails, redirect with error instead of silently failing
      console.error('Image upload failed:', e, { 
        errorMessage: e?.message, 
        errorStack: e?.stack,
        imageSize: imageFile?.size,
        imageType: imageFile?.type,
        username: user?.username
      });
      redirectUrl.searchParams.set('error', 'upload_failed');
      return NextResponse.redirect(redirectUrl, 303);
    }
  }

  const db = await getDb();
  const imageUploadsEnabled = await isImageUploadsEnabled(db);
  
  // Check if project is locked (rollout-safe)
  try {
    const project = await db
      .prepare('SELECT is_locked FROM projects WHERE id = ?')
      .bind(id)
      .first();
    if (project && project.is_locked) {
      redirectUrl.searchParams.set('error', 'locked');
      return NextResponse.redirect(redirectUrl, 303);
    }
  } catch (e) {
    // Column might not exist yet, that's okay - allow posting
  }

  // Enforce one-level threading: only allow replying to a top-level reply.
  let effectiveReplyTo = replyToId;
  if (replyToId) {
    try {
      const parent = await db
        .prepare(
          `SELECT id, reply_to_id
           FROM project_replies
           WHERE id = ? AND project_id = ? AND is_deleted = 0`
        )
        .bind(replyToId, id)
        .first();
      if (!parent) {
        effectiveReplyTo = null;
      } else if (parent.reply_to_id) {
        // Parent is already a child; clamp to one level by replying to the top-level parent.
        effectiveReplyTo = parent.reply_to_id;
      }
    } catch (e) {
      // If migrations aren't applied yet, just ignore reply-to and post as top-level.
      effectiveReplyTo = null;
    }
  }

  // Safe: API routes are server-only, Date.now() does not cause hydration mismatches
  const now = Date.now();
  try {
    // Try with image_key first (if migration is applied)
    try {
      const replyId = crypto.randomUUID();
      const result = await db
        .prepare(
          `INSERT INTO project_replies (id, project_id, author_user_id, body, created_at, reply_to_id, image_key)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(replyId, id, user.id, finalBody, now, effectiveReplyTo, imageKey)
        .run();
      console.log('Project reply created successfully with image_key', { replyId, projectId: id, hasImage: !!imageKey });
    } catch (e) {
      // Fallback if image_key column doesn't exist yet
      if (imageKey) {
        // If we have an image but the column doesn't exist, log error but still try to insert without image
        console.error('Image key provided but image_key column may not exist, inserting without image', e);
      }
      const replyId = crypto.randomUUID();
      const result = await db
        .prepare(
          `INSERT INTO project_replies (id, project_id, author_user_id, body, created_at, reply_to_id)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(replyId, id, user.id, finalBody, now, effectiveReplyTo)
        .run();
      console.log('Project reply created successfully without image_key', { replyId, projectId: id });
    }
  } catch (e) {
    // Database insert failed
    console.error('Failed to create project reply:', e, { projectId: id, userId: user?.id, bodyLength: finalBody.length, hasImage: !!imageKey });
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Create in-app notifications for project author + participants (excluding the replier).
  try {
    // Create mention notifications
    await createMentionNotifications({
      text: finalBody,
      actorId: user.id,
      targetType: 'project',
      targetId: id,
      requestUrl: request.url
    });

    const project = await db
      .prepare('SELECT author_user_id, title, notify_reply_enabled, u.email, u.phone, u.notify_email_enabled, u.notify_sms_enabled FROM projects JOIN users ON users.id = projects.author_user_id WHERE projects.id = ?')
      .bind(id)
      .first();

    const recipients = new Map();
    if (project?.author_user_id && project.author_user_id !== user.id && project.notify_reply_enabled !== 0) {
      recipients.set(project.author_user_id, project);
    }

    const { results: participants } = await db
      .prepare(
        `SELECT DISTINCT pr.author_user_id, u.email, u.phone, u.notify_reply_enabled, u.notify_email_enabled, u.notify_sms_enabled
         FROM project_replies pr
         JOIN users u ON u.id = pr.author_user_id
         WHERE pr.project_id = ? AND pr.is_deleted = 0`
      )
      .bind(id)
      .all();

    for (const row of participants || []) {
      if (row?.author_user_id && row.author_user_id !== user.id && row.notify_reply_enabled !== 0) {
        recipients.set(row.author_user_id, row);
      }
    }

    const actorUsername = user.username || 'Someone';

    for (const [recipientUserId, recipient] of recipients) {
      await db
        .prepare(
          `INSERT INTO notifications
            (id, user_id, actor_user_id, type, target_type, target_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          crypto.randomUUID(),
          recipientUserId,
          user.id,
          'reply',
          'project',
          id,
          now
        )
        .run();

      // Send outbound notification
      try {
        await sendOutboundNotification({
          requestUrl: request.url,
          recipient,
          actorUsername,
          type: 'reply',
          targetType: 'project',
          targetId: id,
          targetTitle: project?.title,
          bodySnippet: finalBody
        });
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // Notifications table might not exist yet, ignore
  }

  // Convert URL to string and append hash if needed (Next.js redirect doesn't preserve URL.hash property)
  let finalRedirectUrl = redirectUrl.toString();
  if (effectiveReplyTo) {
    finalRedirectUrl = `${finalRedirectUrl}#reply-${effectiveReplyTo}`;
  }
  return NextResponse.redirect(finalRedirectUrl, 303);
}
