import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  
  try {
    const now = Date.now();

    // Upsert read state
    await db
      .prepare(
        `INSERT INTO content_reads (id, user_id, content_type, content_id, last_read_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, content_type, content_id) 
         DO UPDATE SET last_read_at = ?`
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        'dev_log',
        params.id,
        now,
        now
      )
      .run();
  } catch (e) {
    // content_reads table might not exist yet - that's okay
    // The page will still load, just without read tracking
  }

  return NextResponse.json({ ok: true });
}
