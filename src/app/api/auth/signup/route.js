import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { createToken } from '../../../../lib/tokens';
import { setSessionCookie } from '../../../../lib/session';
import { validateUsername } from '../../../../lib/username';
import { hashPassword, normalizeEmail } from '../../../../lib/passwords';
import { normalizePhone } from '../../../../lib/phones';

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

  const firstName = String(payload.firstName || '').trim();
  const lastName = String(payload.lastName || '').trim();

  const emailRaw = String(payload.email || '').trim();
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (!email) {
    return NextResponse.json({ error: 'Please provide an email address.' }, { status: 400 });
  }
  if (email && !email.includes('@')) {
    return NextResponse.json({ error: 'Please provide a valid email.' }, { status: 400 });
  }

  const phoneRaw = String(payload.phone || '').trim();
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (payload.notifySmsEnabled && !phone) {
    return NextResponse.json({ error: 'Please provide a phone number to enable SMS notifications.' }, { status: 400 });
  }
  if (phoneRaw && !phone) {
    return NextResponse.json(
      { error: 'Please provide a valid phone number (include country code if outside the US).' },
      { status: 400 }
    );
  }

  const password = String(payload.password || '').trim();
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
  const notifyEmailEnabled = payload.notifyEmailEnabled ? 1 : 0;
  const notifySmsEnabled = payload.notifySmsEnabled ? 1 : 0;

  try {
    // Try with notification preferences and default_landing_page (if migrations applied)
    try {
      await db
        .prepare(
          `INSERT INTO users
            (id, username, username_norm, first_name, last_name, email, email_norm, phone, phone_norm, password_hash, password_set_at, must_change_password, session_token, role, notify_email_enabled, notify_sms_enabled, default_landing_page, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          userId,
          validation.display,
          validation.normalized,
          firstName,
          lastName,
          email,
          email,
          phone,
          phone,
          passwordHash,
          now,
          0,
          token,
          'user',
          notifyEmailEnabled,
          notifySmsEnabled,
          'feed',
          now
        )
        .run();
    } catch (e) {
      // Fallback if phone columns don't exist yet (but notification columns do)
      try {
        await db
          .prepare(
            `INSERT INTO users
              (id, username, username_norm, email, email_norm, password_hash, password_set_at, must_change_password, session_token, role, notify_email_enabled, notify_sms_enabled, default_landing_page, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            userId,
            validation.display,
            validation.normalized,
            email,
            email,
            passwordHash,
            now,
            0,
            token,
            'user',
            notifyEmailEnabled,
            notifySmsEnabled,
            'feed',
            now
          )
          .run();
      } catch (e2) {
        // Fallback if notification/default_landing_page columns don't exist yet
        try {
          await db
            .prepare(
              `INSERT INTO users
                (id, username, username_norm, email, email_norm, password_hash, password_set_at, must_change_password, session_token, role, default_landing_page, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              userId,
              validation.display,
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
        } catch (e3) {
          // Fallback if default_landing_page column doesn't exist yet
          await db
            .prepare(
              `INSERT INTO users
                (id, username, username_norm, email, email_norm, password_hash, password_set_at, must_change_password, session_token, role, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              userId,
              validation.display,
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
      }
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

  // Navigation tip notification (for users after the header notification icon move)
  try {
    await db
      .prepare(
        `INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        userId,
        userId,
        'navigation_tip',
        'system',
        'header_messages_and_kebab_v1',
        now
      )
      .run();
  } catch (e) {
    // Notifications table might not exist yet, ignore
  }

  // Admin notifications for new signups (opt-in)
  try {
    const { results: admins } = await db
      .prepare('SELECT id FROM users WHERE role = ? AND notify_admin_new_user_enabled = 1')
      .bind('admin')
      .all();

    if (admins && admins.length) {
      await Promise.all(
        admins.map((admin) =>
          db
            .prepare(
              `INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              crypto.randomUUID(),
              admin.id,
              userId,
              'admin_signup',
              'user',
              validation.normalized,
              now
            )
            .run()
        )
      );
    }
  } catch (e) {
    // Ignore admin notification failures
  }

  const response = NextResponse.json({
    ok: true,
    username: validation.display,
    email
  });
  setSessionCookie(response, token);
  return response;
}
