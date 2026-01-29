import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function GET(request, { params }) {
  const { username } = await params;
  const db = await getDb();

  try {
    const user = await db
      .prepare('SELECT username, avatar_key, preferred_username_color_index, role FROM users WHERE username = ?')
      .bind(username)
      .first();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
