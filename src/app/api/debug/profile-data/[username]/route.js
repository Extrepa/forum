import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getStatsForUser } from '../../../../../lib/stats';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const db = await getDb();
  const rawUsername = params?.username;

  if (!rawUsername) {
    return NextResponse.json({ error: 'No username provided' }, { status: 400 });
  }

  const username = decodeURIComponent(rawUsername);

  let profileUser = null;
  try {
    profileUser = await db
      .prepare(
        'SELECT id, username, role, created_at, profile_bio, profile_links, preferred_username_color_index, profile_views, avatar_key, time_spent_minutes, avatar_edit_minutes, profile_mood_text, profile_mood_emoji, profile_song_url, profile_song_provider, profile_song_autoplay_enabled, profile_headline, default_profile_tab, profile_cover_mode FROM users WHERE username_norm = ?'
      )
      .bind(username.toLowerCase())
      .first();
  } catch (_) {
    try {
      profileUser = await db
        .prepare(
          'SELECT id, username, role, created_at, profile_bio, profile_links, preferred_username_color_index, profile_views, avatar_key, time_spent_minutes, avatar_edit_minutes, profile_mood_text, profile_mood_emoji, profile_song_url, profile_song_provider, profile_song_autoplay_enabled, profile_headline, default_profile_tab FROM users WHERE username_norm = ?'
        )
        .bind(username.toLowerCase())
        .first();
    } catch (__) {
      try {
        profileUser = await db
          .prepare(
            'SELECT id, username, role, created_at, profile_bio, profile_links, preferred_username_color_index, profile_views, avatar_key FROM users WHERE username_norm = ?'
          )
          .bind(username.toLowerCase())
          .first();
      } catch (e) {
        console.error("Error fetching profile user in debug API:", e);
        profileUser = null;
      }
    }
  }

  if (!profileUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const stats = await getStatsForUser(db, profileUser.id);

  return NextResponse.json({
    profileUser,
    stats,
  });
}
