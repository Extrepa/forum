import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { validateUsername } from '../../../../lib/username';

export async function GET(request) {
  const username = request.nextUrl.searchParams.get('username') || '';
  const validation = validateUsername(username);
  if (!validation.ok) {
    return NextResponse.json({
      ok: true,
      available: false,
      message: validation.message
    });
  }

  try {
    const db = await getDb();
    const existing = await db
      .prepare('SELECT id FROM users WHERE username_norm = ?')
      .bind(validation.normalized)
      .first();

    if (existing?.id) {
      return NextResponse.json({
        ok: true,
        available: false,
        message: 'That username is already taken.'
      });
    }

    return NextResponse.json({
      ok: true,
      available: true,
      message: 'Username is available.'
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, available: false, message: 'Unable to verify username right now.' },
      { status: 500 }
    );
  }
}
