import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

const ALLOWED_MODES = new Set(['cover', 'contain', 'stretch']);

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

  const rawMode = (body.profile_cover_mode || '').toLowerCase().trim();
  const mode = ALLOWED_MODES.has(rawMode) ? rawMode : 'cover';

  let db;
  try {
    db = await getDb();
  } catch (e) {
    console.error('profile-cover-mode getDb failed', e);
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }

  try {
    await db
      .prepare('UPDATE users SET profile_cover_mode = ? WHERE id = ?')
      .bind(mode, user.id)
      .run();
    const row = await db
      .prepare('SELECT profile_cover_mode FROM users WHERE id = ?')
      .bind(user.id)
      .first();
    return NextResponse.json({ ok: true, profileCoverMode: row?.profile_cover_mode ?? mode });
  } catch (e) {
    console.error('profile-cover-mode update failed', e?.message ?? e, e);
    return NextResponse.json(
      { error: 'update failed', hint: 'Ensure migration 0058_add_profile_cover_mode has been applied.' },
      { status: 500 }
    );
  }
}
