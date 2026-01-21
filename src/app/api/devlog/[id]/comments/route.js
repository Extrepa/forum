import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUserWithRole } from '../../../../../lib/admin';
import { getSessionUser } from '../../../../../lib/auth';

export async function GET(request, { params }) {
  const user = await getSessionUserWithRole();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT dev_log_comments.id, dev_log_comments.body, dev_log_comments.created_at,
              users.username AS author_name
       FROM dev_log_comments
       JOIN users ON users.id = dev_log_comments.author_user_id
       WHERE dev_log_comments.log_id = ? AND dev_log_comments.is_deleted = 0
       ORDER BY dev_log_comments.created_at ASC`
    )
    .bind(params.id)
    .all();

  return NextResponse.json(results);
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
  const redirectUrl = new URL(`/devlog/${params.id}`, request.url);

  if (!user) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }
  if (user.must_change_password || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'password');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const log = await db
    .prepare('SELECT is_locked FROM dev_logs WHERE id = ?')
    .bind(params.id)
    .first();

  if (!log) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (log.is_locked) {
    redirectUrl.searchParams.set('error', 'locked');
    return NextResponse.redirect(redirectUrl, 303);
  }

  await db
    .prepare(
      'INSERT INTO dev_log_comments (id, log_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), params.id, user.id, body, Date.now())
    .run();

  return NextResponse.redirect(redirectUrl, 303);
}

