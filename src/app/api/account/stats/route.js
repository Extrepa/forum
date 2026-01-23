import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export async function GET() {
  const user = await getSessionUser();
  
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = await getDb();

  try {
    const threadCount = await db
      .prepare('SELECT COUNT(*) as count FROM forum_threads WHERE author_user_id = ?')
      .bind(user.id)
      .first();
    
    const replyCount = await db
      .prepare('SELECT COUNT(*) as count FROM forum_replies WHERE author_user_id = ? AND is_deleted = 0')
      .bind(user.id)
      .first();

    const recentThreads = await db
      .prepare(
        `SELECT id, title, created_at FROM forum_threads 
         WHERE author_user_id = ? 
         ORDER BY created_at DESC LIMIT 10`
      )
      .bind(user.id)
      .all();

    const recentReplies = await db
      .prepare(
        `SELECT forum_replies.id, forum_replies.created_at, forum_threads.id as thread_id, forum_threads.title as thread_title
         FROM forum_replies
         JOIN forum_threads ON forum_threads.id = forum_replies.thread_id
         WHERE forum_replies.author_user_id = ? AND forum_replies.is_deleted = 0
         ORDER BY forum_replies.created_at DESC LIMIT 10`
      )
      .bind(user.id)
      .all();

    const userInfo = await db
      .prepare('SELECT created_at FROM users WHERE id = ?')
      .bind(user.id)
      .first();

    // Merge and sort recent activity
    const allActivity = [
      ...(recentThreads?.results || []).map(t => ({ ...t, type: 'thread' })),
      ...(recentReplies?.results || []).map(r => ({ ...r, type: 'reply' }))
    ].sort((a, b) => b.created_at - a.created_at).slice(0, 10);

    return NextResponse.json({
      threadCount: threadCount?.count || 0,
      replyCount: replyCount?.count || 0,
      joinDate: userInfo?.created_at || user.created_at,
      recentThreads: recentThreads?.results || [],
      recentReplies: recentReplies?.results || [],
      recentActivity: allActivity,
    });
  } catch (e) {
    return NextResponse.json({
      threadCount: 0,
      replyCount: 0,
      joinDate: user.created_at,
      recentThreads: [],
      recentReplies: [],
      recentActivity: [],
    });
  }
}
