import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

const DEFAULT_SHOW_ROLE = true;

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !user.password_hash) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (typeof body.profile_show_role !== 'boolean') {
    return NextResponse.json({ error: 'profile_show_role must be a boolean' }, { status: 400 });
  }

  const showRoleValue = body.profile_show_role ? 1 : 0;

  let db;
  try {
    db = await getDb();
  } catch (e) {
    console.error('profile-show-role getDb failed', e);
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }

  try {
    await db
      .prepare('UPDATE users SET profile_show_role = ? WHERE id = ?')
      .bind(showRoleValue, user.id)
      .run();
    return NextResponse.json({ profileShowRole: Boolean(body.profile_show_role) });
  } catch (e) {
    console.error('profile-show-role update failed', e?.message ?? e);
    return NextResponse.json(
      { error: 'update failed', hint: 'Ensure migration 0059_add_profile_display_settings has been applied.' },
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
      .prepare('SELECT profile_show_role FROM users WHERE id = ?')
      .bind(user.id)
      .first();
    return NextResponse.json({
      profileShowRole: row?.profile_show_role != null ? Boolean(row.profile_show_role) : DEFAULT_SHOW_ROLE,
    });
  } catch (e) {
    console.error('profile-show-role read failed', e?.message ?? e);
    return NextResponse.json(
      { error: 'read failed', hint: 'Ensure migration 0059_add_profile_display_settings has been applied.' },
      { status: 500 }
    );
  }
}
