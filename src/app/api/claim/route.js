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
