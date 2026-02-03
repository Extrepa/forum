import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

const ALLOWED_PROVIDERS = ['soundcloud', 'spotify', 'youtube', 'youtube-music'];

function sanitizeText(str, maxLen = 500) {
  if (str == null || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

function isValidUrl(str) {
  if (!str || typeof str !== 'string') return false;
  try {
    const u = new URL(str.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const moodText = sanitizeText(body.profile_mood_text, 200);
  const moodEmoji = sanitizeText(body.profile_mood_emoji, 20);
  const headline = sanitizeText(body.profile_headline, 300);
  let songUrl = sanitizeText(body.profile_song_url, 2000);
  let songProvider = (body.profile_song_provider || '').toLowerCase().trim();
  const songAutoplayEnabled = Boolean(body.profile_song_autoplay_enabled);
  const songProviderGlow = body.profile_song_provider_glow;
  const glowValue = songProviderGlow == null ? null : (songProviderGlow ? 1 : 0);
  const profileShowRole = body.profile_show_role;

  if (songProvider && !ALLOWED_PROVIDERS.includes(songProvider)) {
    songProvider = '';
  }
  if (songUrl && !isValidUrl(songUrl)) {
    songUrl = '';
  }
  if (songUrl && !songProvider) {
    songProvider = 'soundcloud';
  }

  let db;
  try {
    db = await getDb();
  } catch (e) {
    console.error('profile-extras getDb failed', e);
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }

  try {
    await db
      .prepare(
        `UPDATE users SET
          profile_mood_text = ?,
          profile_mood_emoji = ?,
          profile_mood_updated_at = ?,
          profile_song_url = ?,
          profile_song_provider = ?,
          profile_song_autoplay_enabled = ?,
          profile_song_provider_glow = COALESCE(?, profile_song_provider_glow),
          profile_headline = ?,
          profile_show_role = ?
        WHERE id = ?`
      )
      .bind(
        moodText || null,
        moodEmoji || null,
        songUrl || moodText || moodEmoji ? Math.floor(Date.now() / 1000) : null,
        songUrl || null,
        songProvider || null,
        songAutoplayEnabled ? 1 : 0,
        glowValue,
        headline || null,
        profileShowRole === undefined ? null : (profileShowRole ? 1 : 0),
        user.id
      )
      .run();

    // Read back from DB to verify write
    const row = await db
      .prepare(
        `SELECT profile_mood_text, profile_mood_emoji, profile_song_url, profile_song_provider, profile_song_autoplay_enabled, profile_song_provider_glow, profile_headline, profile_show_role FROM users WHERE id = ?`
      )
      .bind(user.id)
      .first();

    return NextResponse.json({
      ok: true,
      profileMoodText: row?.profile_mood_text ?? moodText ?? '',
      profileMoodEmoji: row?.profile_mood_emoji ?? moodEmoji ?? '',
      profileHeadline: row?.profile_headline ?? headline ?? '',
      profileSongUrl: row?.profile_song_url ?? songUrl ?? '',
      profileSongProvider: row?.profile_song_provider ?? songProvider ?? '',
      profileSongAutoplayEnabled: row?.profile_song_autoplay_enabled != null ? Boolean(row.profile_song_autoplay_enabled) : songAutoplayEnabled,
      profileSongProviderGlow: row?.profile_song_provider_glow != null ? Boolean(row.profile_song_provider_glow) : (songProviderGlow != null ? Boolean(songProviderGlow) : true),
      profileShowRole: row?.profile_show_role != null ? Boolean(row.profile_show_role) : (profileShowRole != null ? Boolean(profileShowRole) : true),
    });
  } catch (e) {
    console.error('profile-extras update failed', e?.message ?? e, e);
    return NextResponse.json(
      { error: 'update failed', hint: 'Ensure migration 0059 has been applied.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let db;
  try {
    db = await getDb();
  } catch (e) {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
  try {
    const row = await db
      .prepare(
        `SELECT profile_mood_text, profile_mood_emoji, profile_song_url, profile_song_provider, profile_song_autoplay_enabled, profile_song_provider_glow, profile_headline, profile_show_role FROM users WHERE id = ?`
      )
      .bind(user.id)
      .first();
    return NextResponse.json({
      profileMoodText: row?.profile_mood_text ?? '',
      profileMoodEmoji: row?.profile_mood_emoji ?? '',
      profileHeadline: row?.profile_headline ?? '',
      profileSongUrl: row?.profile_song_url ?? '',
      profileSongProvider: row?.profile_song_provider ?? '',
      profileSongAutoplayEnabled: Boolean(row?.profile_song_autoplay_enabled),
      profileSongProviderGlow: row?.profile_song_provider_glow != null ? Boolean(row.profile_song_provider_glow) : true,
      profileShowRole: row?.profile_show_role != null ? Boolean(row.profile_show_role) : true,
    });
  } catch (e) {
    console.error('profile-extras GET failed', e?.message ?? e);
    return NextResponse.json(
      { error: 'read failed', hint: 'Ensure migration 0059 has been applied.' },
      { status: 500 }
    );
  }
}
