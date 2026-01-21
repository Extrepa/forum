import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { hashPassword, verifyPassword } from '../../../../lib/passwords';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const oldPassword = String(payload.oldPassword || '');
  const newPassword = String(payload.newPassword || '');
  if (!newPassword) {
    return NextResponse.json({ error: 'Missing new password.' }, { status: 400 });
  }

  const db = await getDb();
  const row = await db
    .prepare('SELECT password_hash, must_change_password FROM users WHERE id = ?')
    .bind(user.id)
    .first();

  if (!row) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If we forced a change, allow setting new password without old password,
  // as long as they're already logged in.
  if (!row.must_change_password) {
    if (!row.password_hash) {
      return NextResponse.json({ error: 'No password is set for this account.' }, { status: 400 });
    }
    const ok = await verifyPassword(oldPassword, row.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Old password is incorrect.' }, { status: 401 });
    }
  }

  let newHash = null;
  try {
    newHash = await hashPassword(newPassword);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Invalid password.' }, { status: 400 });
  }

  const now = Date.now();
  await db
    .prepare(
      'UPDATE users SET password_hash = ?, password_set_at = ?, must_change_password = 0 WHERE id = ?'
    )
    .bind(newHash, now, user.id)
    .run();

  return NextResponse.json({ ok: true, mustChangePassword: false });
}

