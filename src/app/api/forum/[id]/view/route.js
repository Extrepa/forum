import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export async function POST(request, { params }) {
  const db = await getDb();
  
  try {
    // Increment view count atomically
    await db
      .prepare('UPDATE forum_threads SET views = views + 1 WHERE id = ?')
      .bind(params.id)
      .run();
  } catch (e) {
    // views column might not exist yet - that's okay, just return success
    // The page will still load, just without view tracking
  }

  return NextResponse.json({ ok: true });
}
