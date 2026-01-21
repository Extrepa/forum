import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const redirectUrl = new URL(`/forum/${params.id}`, request.url);

  if (!user) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }
  if (user.must_change_password || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'password');
    return NextResponse.redirect(redirectUrl, 303);
  }
  if (user.role !== 'admin') {
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const thread = await db
    .prepare(
      'SELECT id, author_user_id, title, body, created_at, image_key FROM forum_threads WHERE id = ?'
    )
    .bind(params.id)
    .first();

  if (!thread) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const existingProject = await db
    .prepare('SELECT id FROM projects WHERE id = ?')
    .bind(thread.id)
    .first();

  if (!existingProject) {
    await db
      .prepare(
        `INSERT INTO projects
          (id, author_user_id, title, description, status, github_url, demo_url, image_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        thread.id,
        thread.author_user_id,
        thread.title,
        thread.body,
        'active',
        null,
        null,
        thread.image_key || null,
        thread.created_at,
        null
      )
      .run();
  }

  const movedTitle = thread.title?.startsWith('[Moved to Projects] ')
    ? thread.title
    : `[Moved to Projects] ${thread.title}`;
  const movedBody = `This post was moved to Projects: /projects/${thread.id}`;
  const now = Date.now();

  await db
    .prepare('UPDATE forum_threads SET is_locked = 1, title = ?, body = ?, updated_at = ? WHERE id = ?')
    .bind(movedTitle, movedBody, now, thread.id)
    .run();

  return NextResponse.redirect(new URL(`/projects/${thread.id}`, request.url), 303);
}

