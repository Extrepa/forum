import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { createMentionNotifications } from '../../../../../lib/mentions';
import { sendOutboundNotification } from '../../../../../lib/outboundNotifications';

export async function GET(request, { params }) {
  const { id } = await params;
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT project_comments.id, project_comments.body, project_comments.created_at,
              users.username AS author_name
       FROM project_comments
       JOIN users ON users.id = project_comments.author_user_id
       WHERE project_comments.project_id = ? AND project_comments.is_deleted = 0
       ORDER BY project_comments.created_at ASC`
    )
    .bind(id)
    .all();

  return NextResponse.json(results);
}

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
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
  
  const now = Date.now();
  await db
    .prepare(
      'INSERT INTO project_comments (id, project_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), id, user.id, body, now)
    .run();

  // Create in-app notifications for project author + participants (excluding the commenter).
  try {
    // Create mention notifications
    await createMentionNotifications({
      text: body,
      actorId: user.id,
      targetType: 'project',
      targetId: id,
      requestUrl: request.url
    });

    const projectAuthor = await db
      .prepare('SELECT author_user_id, title, notify_comment_enabled, u.email, u.phone, u.notify_email_enabled, u.notify_sms_enabled FROM projects JOIN users u ON u.id = projects.author_user_id WHERE projects.id = ?')
      .bind(id)
      .first();

    const recipients = new Map();
    if (projectAuthor?.author_user_id && projectAuthor.author_user_id !== user.id && projectAuthor.notify_comment_enabled !== 0) {
      recipients.set(projectAuthor.author_user_id, projectAuthor);
    }

    const { results: participants } = await db
      .prepare(
        `SELECT DISTINCT pc.author_user_id, u.email, u.phone, u.notify_comment_enabled, u.notify_email_enabled, u.notify_sms_enabled 
         FROM project_comments pc
         JOIN users u ON u.id = pc.author_user_id
         WHERE pc.project_id = ? AND pc.is_deleted = 0`
      )
      .bind(id)
      .all();

    for (const row of participants || []) {
      if (row?.author_user_id && row.author_user_id !== user.id && row.notify_comment_enabled !== 0) {
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
          'comment',
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
          type: 'comment',
          targetType: 'project',
          targetId: id,
          targetTitle: projectAuthor?.title,
          bodySnippet: body
        });
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // Notifications table might not exist yet, ignore
  }

  return NextResponse.redirect(redirectUrl, 303);
}
