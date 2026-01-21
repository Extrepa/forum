import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export async function POST(request, { params }) {
  const db = await getDb();
  
  // Increment view count atomically
  await db
    .prepare('UPDATE forum_threads SET views = views + 1 WHERE id = ?')
    .bind(params.id)
    .run();

  return NextResponse.json({ ok: true });
}
