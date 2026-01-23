import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { validateUsername, normalizeUsername } from '../../../../lib/username';

export async function POST(request) {
  const user = await getSessionUser();
  
  if (!user || !user.password_hash) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const newUsername = String(formData.get('username') || '').trim();

  const validation = validateUsername(newUsername);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const db = await getDb();
  const normalized = validation.normalized;

  // Check if username is already taken (by a different user)
  const existing = await db
    .prepare('SELECT id FROM users WHERE username_norm = ? AND id != ?')
    .bind(normalized, user.id)
    .first();

  if (existing) {
    return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
  }

  // Update username
  try {
    await db
      .prepare('UPDATE users SET username = ?, username_norm = ? WHERE id = ?')
      .bind(newUsername, normalized, user.id)
      .run();

    return NextResponse.json({ success: true, username: newUsername });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
  }
}
