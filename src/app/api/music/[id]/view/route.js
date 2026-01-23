import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export async function POST(request, { params }) {
  const db = await getDb();
  
  try {
    await db
      .prepare('UPDATE music_posts SET views = views + 1 WHERE id = ?')
      .bind(params.id)
      .run();
  } catch (e) {
    // views column might not exist yet
  }

  return NextResponse.json({ ok: true });
}
