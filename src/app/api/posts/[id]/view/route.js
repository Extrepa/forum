import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  const db = await getDb();
  const { id } = await params; // Next.js 15: params is a Promise
  const user = await getSessionUser();
  
  // Check if user is the author - don't count author's own views
  if (user) {
    try {
      const post = await db
        .prepare('SELECT author_user_id FROM posts WHERE id = ?')
        .bind(id)
        .first();
      
      if (post && post.author_user_id === user.id) {
        // Author viewing their own post - don't increment view count
        return NextResponse.json({ ok: true, skipped: true });
      }
    } catch (e) {
      // If we can't check, continue and try to increment anyway
    }
  }
  
  try {
    // Increment view count atomically for this specific post
    await db
      .prepare('UPDATE posts SET views = views + 1 WHERE id = ?')
      .bind(id)
      .run();
  } catch (e) {
    // views column might not exist yet
  }

  return NextResponse.json({ ok: true });
}
