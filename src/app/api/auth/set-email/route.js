import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { normalizeEmail } from '../../../../lib/passwords';

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

  const email = normalizeEmail(payload.email);
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Please provide a valid email.' }, { status: 400 });
  }

  const db = await getDb();
  try {
    await db
      .prepare('UPDATE users SET email = ?, email_norm = ? WHERE id = ?')
      .bind(email, email, user.id)
      .run();
  } catch (error) {
    if (String(error).includes('UNIQUE')) {
      return NextResponse.json({ error: 'That email is already taken.' }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true, email });
}

