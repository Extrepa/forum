import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../../lib/db';
import { createToken } from '../../../../lib/tokens';
import { validateUsername } from '../../../../lib/username';
import { hashPassword } from '../../../../lib/passwords';

async function upsertUserWithTempPassword(db, username, { role, tempPassword }) {
  const validation = validateUsername(username);
  if (!validation.ok) {
    throw new Error(`Invalid username: ${username}`);
  }

  const now = Date.now();
  const passwordHash = await hashPassword(tempPassword);

  const existing = await db
    .prepare('SELECT id FROM users WHERE username_norm = ?')
    .bind(validation.normalized)
    .first();

  if (existing?.id) {
    await db
      .prepare(
        'UPDATE users SET role = ?, password_hash = ?, password_set_at = ?, must_change_password = 1 WHERE id = ?'
      )
      .bind(role, passwordHash, now, existing.id)
      .run();
    return { username: validation.normalized, id: existing.id, created: false };
  }

  const userId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO users
        (id, username, username_norm, role, password_hash, password_set_at, must_change_password, session_token, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      userId,
      validation.normalized,
      validation.normalized,
      role,
      passwordHash,
      now,
      1,
      createToken(),
      now
    )
    .run();

  return { username: validation.normalized, id: userId, created: true };
}

export async function POST(request) {
  const { env } = await getCloudflareContext({ async: true });
  const adminToken = env.ADMIN_RESET_TOKEN;
  const provided = request.headers.get('x-admin-token');

  if (!adminToken || provided !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    // ok, defaults apply
  }

  const tempPassword = String(payload.tempPassword || 'Password');

  const db = await getDb();
  const results = [];

  // extrepa is admin
  results.push(await upsertUserWithTempPassword(db, 'extrepa', { role: 'admin', tempPassword }));
  results.push(await upsertUserWithTempPassword(db, 'geofryd', { role: 'user', tempPassword }));
  results.push(await upsertUserWithTempPassword(db, 'ashley', { role: 'user', tempPassword }));

  return NextResponse.json({
    ok: true,
    tempPasswordPolicy: 'must_change_password',
    users: results
  });
}

