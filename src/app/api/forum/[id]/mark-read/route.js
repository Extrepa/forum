import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  
  // Get the latest reply ID for this thread
  const latestReply = await db
    .prepare(
      `SELECT id, created_at FROM forum_replies 
       WHERE thread_id = ? AND is_deleted = 0 
       ORDER BY created_at DESC LIMIT 1`
    )
    .bind(params.id)
    .first();

  const now = Date.now();
  const lastReadReplyId = latestReply?.id || null;

  // Upsert read state
  await db
    .prepare(
      `INSERT INTO forum_thread_reads (id, user_id, thread_id, last_read_at, last_read_reply_id)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, thread_id) 
       DO UPDATE SET last_read_at = ?, last_read_reply_id = ?`
    )
    .bind(
      crypto.randomUUID(),
      user.id,
      params.id,
      now,
      lastReadReplyId,
      now,
      lastReadReplyId
    )
    .run();

  return NextResponse.json({ ok: true });
}
