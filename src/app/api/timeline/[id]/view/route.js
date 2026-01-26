import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export async function POST(request, { params }) {
  const db = await getDb();
  const { id } = await params; // Next.js 15: params is a Promise
  
  try {
    // Increment view count atomically for this specific post
    await db
      .prepare('UPDATE timeline_updates SET views = views + 1 WHERE id = ?')
      .bind(id)
      .run();
  } catch (e) {
    // views column might not exist yet
  }

  return NextResponse.json({ ok: true });
}
