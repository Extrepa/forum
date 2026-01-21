import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { createToken } from '../../../../lib/tokens';
import { setSessionCookie } from '../../../../lib/session';
import { validateUsername } from '../../../../lib/username';
import { hashPassword, normalizeEmail } from '../../../../lib/passwords';

export async function POST(request) {
  const db = await getDb();

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

  const email = normalizeEmail(payload.email);
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Please provide a valid email.' }, { status: 400 });
  }

  const password = String(payload.password || '');
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  if (/\s/.test(password)) {
    return NextResponse.json({ error: 'Password cannot contain spaces.' }, { status: 400 });
  }
  let passwordHash = null;
  try {
    passwordHash = await hashPassword(password);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Invalid password.' }, { status: 400 });
  }

  const token = createToken();
  const userId = crypto.randomUUID();
  const now = Date.now();

  try {
    // Try with default_landing_page (if migration applied)
    try {
      await db
        .prepare(
          `INSERT INTO users
            (id, username, username_norm, email, email_norm, password_hash, password_set_at, must_change_password, session_token, role, default_landing_page, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          userId,
          validation.normalized,
          validation.normalized,
          email,
          email,
          passwordHash,
          now,
          0,
          token,
          'user',
          'feed',
          now
        )
        .run();
    } catch (e) {
      // Fallback if default_landing_page column doesn't exist yet
      await db
        .prepare(
          `INSERT INTO users
            (id, username, username_norm, email, email_norm, password_hash, password_set_at, must_change_password, session_token, role, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          userId,
          validation.normalized,
          validation.normalized,
          email,
          email,
          passwordHash,
          now,
          0,
          token,
          'user',
          now
        )
        .run();
    }
  } catch (error) {
    if (String(error).includes('UNIQUE')) {
      return NextResponse.json({ error: 'That username or email is already taken.' }, { status: 409 });
    }
    throw error;
  }

  // Create welcome notification
  try {
    await db
      .prepare(
        `INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        userId,
        userId, // Actor is the user themselves for welcome notification
        'welcome',
        'account',
        userId,
        now
      )
      .run();
  } catch (e) {
    // Notifications table might not exist yet, ignore
  }

  const response = NextResponse.json({
    ok: true,
    username: validation.normalized,
    email,
    mustChangePassword: false
  });
  setSessionCookie(response, token);
  return response;
}

