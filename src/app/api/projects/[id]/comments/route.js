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
  
  await db
    .prepare(
      'INSERT INTO project_comments (id, project_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), params.id, user.id, body, Date.now())
    .run();

  return NextResponse.redirect(redirectUrl, 303);
}
