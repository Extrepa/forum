import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function GET(request, { params }) {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT timeline_comments.id, timeline_comments.body, timeline_comments.created_at,
              users.username AS author_name
       FROM timeline_comments
       JOIN users ON users.id = timeline_comments.author_user_id
       WHERE timeline_comments.update_id = ? AND timeline_comments.is_deleted = 0
       ORDER BY timeline_comments.created_at ASC`
    )
    .bind(params.id)
    .all();

  return NextResponse.json(results);
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
  const redirectUrl = new URL(`/timeline/${params.id}`, request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  await db
    .prepare(
      'INSERT INTO timeline_comments (id, update_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), params.id, user.id, body, Date.now())
    .run();

  return NextResponse.redirect(redirectUrl, 303);
}

