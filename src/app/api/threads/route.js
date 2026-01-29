import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { createMentionNotifications } from '../../../lib/mentions';

export async function POST(request) {
  const user = await getSessionUser();
  const redirectUrl = new URL('/lobby', request.url);

  if (!user || !user.password_hash) {
    redirectUrl.searchParams.set('error', 'claim');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();

  if (!title || !body) {
    redirectUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(redirectUrl, 303);
  }

  // Reject image uploads in regular forum - images are only allowed in shitposts
  const formImage = formData.get('image');
  const imageFile = formImage && typeof formImage === 'object' && 'arrayBuffer' in formImage ? formImage : null;
  if (imageFile && imageFile.size > 0) {
    redirectUrl.searchParams.set('error', 'upload');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const db = await getDb();
  const threadId = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare(
      'INSERT INTO forum_threads (id, author_user_id, title, body, created_at, image_key) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(threadId, user.id, title, body, now, null)
    .run();

  // Create mention notifications
  await createMentionNotifications({
    text: body,
    actorId: user.id,
    targetType: 'forum_thread',
    targetId: threadId,
    requestUrl: request.url
  });

  if (user.role !== 'admin') {
    try {
      const { results: admins } = await db
        .prepare('SELECT id FROM users WHERE role = ? AND notify_admin_new_post_enabled = 1')
        .bind('admin')
        .all();

      if (admins && admins.length) {
        await Promise.all(
          admins.map((admin) =>
            db
              .prepare(
                `INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
              )
              .bind(
                crypto.randomUUID(),
                admin.id,
                user.id,
                'admin_post',
                'forum_thread',
                threadId,
                now
              )
              .run()
          )
        );
      }
    } catch (e) {
      // Ignore admin notification failures
    }
  }

  return NextResponse.redirect(redirectUrl, 303);
}
