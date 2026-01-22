import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function GET(request, { params }) {
  const user = await getSessionUser();
  const includePrivate = !!user;
  const db = await getDb();

  try {
    const post = await db.prepare('SELECT type, is_private FROM posts WHERE id = ?').bind(params.id).first();
    if (!post) {
      return NextResponse.json({ error: 'notfound' }, { status: 404 });
    }
    if (!user && (post.type === 'lore' || post.type === 'memories')) {
      return NextResponse.json({ error: 'notfound' }, { status: 404 });
    }
    if (!includePrivate && post.is_private) {
      return NextResponse.json({ error: 'notfound' }, { status: 404 });
    }

    const out = await db
      .prepare(
        `SELECT post_comments.id, post_comments.body, post_comments.reply_to_id,
                post_comments.created_at, post_comments.is_deleted,
                users.username AS author_name
         FROM post_comments
         JOIN users ON users.id = post_comments.author_user_id
         WHERE post_comments.post_id = ?
           AND post_comments.is_deleted = 0
         ORDER BY post_comments.created_at ASC
         LIMIT 300`
      )
      .bind(params.id)
      .all();

    return NextResponse.json(out?.results || []);
  } catch (e) {
    return NextResponse.json({ error: 'notready' }, { status: 409 });
  }
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const redirectUrl = new URL(request.headers.get('referer') || '/', request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const body = String(formData.get('body') || '').trim();
  const replyToId = String(formData.get('reply_to_id') || '').trim() || null;

  if (!body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  let post = null;
  try {
    post = await db.prepare('SELECT type, is_private FROM posts WHERE id = ?').bind(params.id).first();
  } catch (e) {
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!post) {
    redirectUrl.searchParams.set('error', 'notfound');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Redirect back to the correct section detail page.
  redirectUrl.pathname = `/${post.type === 'about' ? 'about' : post.type}/${params.id}`;

  // Member-only/private posts are visible to signed-in users, so no extra check here.
  // Lore/Memories section read-visibility is enforced in the page layer.

  try {
    await db
      .prepare('INSERT INTO post_comments (id, post_id, author_user_id, body, reply_to_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), params.id, user.id, body, replyToId, Date.now())
      .run();
  } catch (e) {
    redirectUrl.searchParams.set('error', 'notready');
    return NextResponse.redirect(redirectUrl, 303);
  }

  return NextResponse.redirect(redirectUrl, 303);
}

