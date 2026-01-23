import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export async function POST(request, { params }) {
  const db = await getDb();
  
  try {
    // Increment view count atomically
    await db
      .prepare('UPDATE dev_logs SET views = views + 1 WHERE id = ?')
      .bind(params.id)
      .run();
  } catch (e) {
    // views column might not exist yet - that's okay, just return success
  }

  return NextResponse.json({ ok: true });
}
