import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
  const replyToIdRaw = String(formData.get('reply_to_id') || '').trim();
  const replyToId = replyToIdRaw ? replyToIdRaw : null;

  const redirectUrl = new URL(`/projects/${params.id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }
  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();

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

  try {
    await db
      .prepare(
        `INSERT INTO project_replies (id, project_id, author_user_id, body, created_at, reply_to_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(crypto.randomUUID(), params.id, user.id, body, Date.now(), effectiveReplyTo)
      .run();
  } catch (e) {
    // Migration not applied yet.
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (effectiveReplyTo) {
    redirectUrl.hash = `reply-${effectiveReplyTo}`;
  }
  return NextResponse.redirect(redirectUrl, 303);
}

