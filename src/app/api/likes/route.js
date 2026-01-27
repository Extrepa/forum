import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { sendOutboundNotification } from '../../../lib/outboundNotifications';

const VALID_POST_TYPES = ['forum_thread', 'music_post', 'event', 'project', 'dev_log', 'timeline_update', 'post'];

function normalizePostType(raw) {
  return String(raw || '').trim().toLowerCase();
}

function isValidPostType(type) {
  return VALID_POST_TYPES.includes(type);
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !user.password_hash) {
    return NextResponse.json({ error: 'Log in to post.' }, { status: 401 });
  }

  const body = await request.json();
  const postType = normalizePostType(body.post_type);
  const postId = String(body.post_id || '').trim();

  if (!isValidPostType(postType) || !postId) {
    return NextResponse.json({ error: 'Invalid post type or ID.' }, { status: 400 });
  }

  const db = await getDb();
  
  try {
    // Check if like already exists
    const existing = await db
      .prepare('SELECT id FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
      .bind(postType, postId, user.id)
      .first();

    if (existing) {
      // Unlike: delete the like
      await db
        .prepare('DELETE FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
        .bind(postType, postId, user.id)
        .run();
      
      // Get updated count
      const countResult = await db
        .prepare('SELECT COUNT(*) AS count FROM post_likes WHERE post_type = ? AND post_id = ?')
        .bind(postType, postId)
        .first();
      
      return NextResponse.json({ 
        liked: false, 
        count: Number(countResult?.count || 0) 
      });
    } else {
      // Like: create new like
      const now = Date.now();
      await db
        .prepare('INSERT INTO post_likes (id, post_type, post_id, user_id, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), postType, postId, user.id, now)
        .run();
      
      // Notify content author
      try {
        let table = null;
        if (postType === 'forum_thread') table = 'forum_threads';
        else if (postType === 'music_post') table = 'music_posts';
        else if (postType === 'event') table = 'events';
        else if (postType === 'project') table = 'projects';
        else if (postType === 'dev_log') table = 'dev_logs';
        else if (postType === 'timeline_update') table = 'timeline_updates';
        else if (postType === 'post') table = 'posts';

        if (table) {
          const author = await db
            .prepare(`
              SELECT c.author_user_id, u.email, u.phone, u.notify_like_enabled, u.notify_email_enabled, u.notify_sms_enabled 
              FROM ${table} c
              JOIN users u ON u.id = c.author_user_id
              WHERE c.id = ?
            `)
            .bind(postId)
            .first();
          
          if (author?.author_user_id && author.author_user_id !== user.id && author.notify_like_enabled !== 0) {
            await db
              .prepare(
                'INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
              )
              .bind(
                crypto.randomUUID(),
                author.author_user_id,
                user.id,
                'like',
                postType,
                postId,
                now
              )
              .run();

            // Send outbound notification
            await sendOutboundNotification({
              requestUrl: request.url,
              recipient: author,
              actorUsername: user.username || 'Someone',
              type: 'like',
              targetType: postType,
              targetId: postId
            });
          }
        }
      } catch (e) {
        // Ignore notification failures
      }
      
      // Get updated count
      const countResult = await db
        .prepare('SELECT COUNT(*) AS count FROM post_likes WHERE post_type = ? AND post_id = ?')
        .bind(postType, postId)
        .first();
      
      return NextResponse.json({ 
        liked: true, 
        count: Number(countResult?.count || 0) 
      });
    }
  } catch (e) {
    // Rollout-safe: if table doesn't exist yet, return error
    return NextResponse.json({ 
      error: 'Likes are not available yet (database updates still applying).' 
    }, { status: 409 });
  }
}
