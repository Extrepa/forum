import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

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
  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  
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
        .bind(replyToId, params.id)
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

  const now = Date.now();
  try {
    await db
      .prepare(
        `INSERT INTO project_replies (id, project_id, author_user_id, body, created_at, reply_to_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(crypto.randomUUID(), params.id, user.id, body, now, effectiveReplyTo)
      .run();
  } catch (e) {
    // Migration not applied yet.
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Create in-app notifications for project author + participants (excluding the replier).
  try {
    const project = await db
      .prepare('SELECT author_user_id FROM projects WHERE id = ?')
      .bind(id)
      .first();

    const recipients = new Set();
    if (project?.author_user_id) {
      recipients.add(project.author_user_id);
    }

    const { results: participants } = await db
      .prepare(
        'SELECT DISTINCT author_user_id FROM project_replies WHERE project_id = ? AND is_deleted = 0'
      )
      .bind(id)
      .all();

    for (const row of participants || []) {
      if (row?.author_user_id) {
        recipients.add(row.author_user_id);
      }
    }

    recipients.delete(user.id);

    for (const recipientUserId of recipients) {
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
    }
  } catch (e) {
    // Notifications table might not exist yet, ignore
  }

  if (effectiveReplyTo) {
    redirectUrl.hash = `reply-${effectiveReplyTo}`;
  }
  return NextResponse.redirect(redirectUrl, 303);
}

