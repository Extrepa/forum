import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';

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
      await db
        .prepare('INSERT INTO post_likes (id, post_type, post_id, user_id, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), postType, postId, user.id, Date.now())
        .run();
      
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
