import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { normalizePhone } from '../../../../lib/phones';

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

  const normalized = normalizePhone(payload.phone);
  if (payload.phone && !normalized) {
    return NextResponse.json(
      { error: 'Please provide a valid phone number (include country code if outside the US).' },
      { status: 400 }
    );
  }

  const db = await getDb();
  try {
    await db
      .prepare('UPDATE users SET phone = ?, phone_norm = ? WHERE id = ?')
      .bind(normalized, normalized, user.id)
      .run();
  } catch (error) {
    if (String(error).includes('UNIQUE')) {
      return NextResponse.json({ error: 'That phone number is already taken.' }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true, phone: normalized });
}

