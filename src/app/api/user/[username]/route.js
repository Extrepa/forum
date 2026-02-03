import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { normalizeUsername } from '../../../../lib/username';

export async function GET(request, { params }) {
  const { username } = await params;
  const db = await getDb();
  const normalizedUsername = normalizeUsername(username);

  try {
    const user = await db
      .prepare(
        `SELECT username, avatar_key, preferred_username_color_index, role,
          profile_mood_text, profile_mood_emoji, profile_show_role, profile_song_provider_glow
         FROM users WHERE username_norm = ?`
      )
      .bind(normalizedUsername)
      .first();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
