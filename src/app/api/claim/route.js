import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getSessionToken } from '../../../lib/session';

export async function GET() {
  const db = await getDb();
  const existingToken = await getSessionToken();

  if (existingToken) {
    const existingUser = await db
      .prepare('SELECT username FROM users WHERE session_token = ?')
      .bind(existingToken)
      .first();
    if (existingUser) {
      return NextResponse.json({ username: existingUser.username });
    }
    try {
      const adminUser = await db
        .prepare('SELECT users.username FROM admin_sessions JOIN users ON users.id = admin_sessions.user_id WHERE admin_sessions.token = ?')
        .bind(existingToken)
        .first();
      if (adminUser) {
        return NextResponse.json({ username: adminUser.username });
      }
    } catch (e) {
      // Ignore if admin_sessions table doesn't exist yet.
    }
  }

  return NextResponse.json({ username: null });
}

export async function POST(request) {
  // Accounts replaced browser-only username claims.
  // Keep this route around only so old clients don't hard-fail.
  void request;
  return NextResponse.json(
    { error: 'Username claiming is deprecated. Please create an account.' },
    { status: 410 }
  );
}
