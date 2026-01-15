import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { createToken } from '../../../lib/tokens';
import { getSessionToken, setSessionCookie } from '../../../lib/session';
import { validateUsername } from '../../../lib/username';

export async function POST(request) {
  const db = await getDb();
  const existingToken = getSessionToken();

  if (existingToken) {
    const existingUser = await db
      .prepare('SELECT username FROM users WHERE session_token = ?')
      .bind(existingToken)
      .first();
    if (existingUser) {
      return NextResponse.json({ username: existingUser.username });
    }
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const validation = validateUsername(payload.username);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const token = createToken();
  const userId = crypto.randomUUID();
  const now = Date.now();

  try {
    await db
      .prepare(
        'INSERT INTO users (id, username, username_norm, session_token, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(userId, validation.normalized, validation.normalized, token, now)
      .run();
  } catch (error) {
    if (String(error).includes('UNIQUE')) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
    }
    throw error;
  }

  const response = NextResponse.json({ username: validation.normalized });
  setSessionCookie(response, token);
  return response;
}
