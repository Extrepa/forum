import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { createToken } from '../../../../lib/tokens';
import { setSessionCookie } from '../../../../lib/session';
import { normalizeUsername } from '../../../../lib/username';
import { isProbablyEmail, normalizeEmail, verifyPassword } from '../../../../lib/passwords';

export async function POST(request) {
  const db = await getDb();

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const identifierRaw = String(payload.identifier || '').trim();
  const password = String(payload.password || '');
  if (!identifierRaw || !password) {
    return NextResponse.json({ error: 'Missing login details.' }, { status: 400 });
  }

  const isEmail = isProbablyEmail(identifierRaw);
  const identifier = isEmail ? normalizeEmail(identifierRaw) : normalizeUsername(identifierRaw);

  const user = await db
    .prepare(
      isEmail
        ? 'SELECT id, username, role, email, password_hash FROM users WHERE email_norm = ?'
        : 'SELECT id, username, role, email, password_hash FROM users WHERE username_norm = ?'
    )
    .bind(identifier)
    .first();

  // Avoid leaking which identifier exists
  if (!user || !user.password_hash) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  const newToken = createToken();
  if (user.role === 'admin') {
    try {
      await db
        .prepare('INSERT INTO admin_sessions (token, user_id, created_at) VALUES (?, ?, ?)')
        .bind(newToken, user.id, Date.now())
        .run();
    } catch (e) {
      await db
        .prepare('UPDATE users SET session_token = ? WHERE id = ?')
        .bind(newToken, user.id)
        .run();
    }
  } else {
    await db
      .prepare('UPDATE users SET session_token = ? WHERE id = ?')
      .bind(newToken, user.id)
      .run();
  }

  const response = NextResponse.json({
    ok: true,
    username: user.username,
    email: user.email ?? null,
    role: user.role
  });
  setSessionCookie(response, newToken);
  return response;
}
