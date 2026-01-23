import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function GET(request, { params }) {
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
    .bind(params.id)
    .all();

  return NextResponse.json(results);
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
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
  
  // Check if project is locked (rollout-safe)
  try {
    const project = await db
      .prepare('SELECT is_locked FROM projects WHERE id = ?')
      .bind(params.id)
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
    .bind(crypto.randomUUID(), params.id, user.id, body, now)
    .run();

  // Create in-app notifications for project author + participants (excluding the commenter).
  try {
    const project = await db
      .prepare('SELECT author_user_id FROM projects WHERE id = ?')
      .bind(params.id)
      .first();

    const recipients = new Set();
    if (project?.author_user_id) {
      recipients.add(project.author_user_id);
    }

    const { results: participants } = await db
      .prepare(
        'SELECT DISTINCT author_user_id FROM project_comments WHERE project_id = ? AND is_deleted = 0'
      )
      .bind(params.id)
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
          'comment',
          'project',
          params.id,
          now
        )
        .run();
    }
  } catch (e) {
    // Notifications table might not exist yet, ignore
  }

  return NextResponse.redirect(redirectUrl, 303);
}
