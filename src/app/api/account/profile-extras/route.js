import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

const ALLOWED_PROVIDERS = ['soundcloud', 'spotify', 'youtube'];

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
          profile_headline = ?
        WHERE id = ?`
      )
      .bind(
        moodText || null,
        moodEmoji || null,
        songUrl || moodText || moodEmoji ? Math.floor(Date.now() / 1000) : null,
        songUrl || null,
        songProvider || null,
        songAutoplayEnabled ? 1 : 0,
        headline || null,
        user.id
      )
      .run();
  } catch (e) {
    console.error('profile-extras update failed', e?.message ?? e, e);
    return NextResponse.json(
      { error: 'update failed', hint: 'Ensure migration 0054_add_profile_mood_song_headline has been applied.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
