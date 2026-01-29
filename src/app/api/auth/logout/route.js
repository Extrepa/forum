import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { createToken } from '../../../../lib/tokens';
import { getSessionUser } from '../../../../lib/auth';
import { getSessionToken, clearSessionCookie } from '../../../../lib/session';

export async function POST() {
  const token = await getSessionToken();
  const user = await getSessionUser();
  const response = NextResponse.json({ ok: true });

  // Always clear cookie on client.
  clearSessionCookie(response);

  // If there was a session, rotate token server-side too.
  if (user) {
    const db = await getDb();
    if (user.role === 'admin') {
      try {
        if (token) {
          await db
            .prepare('DELETE FROM admin_sessions WHERE token = ?')
            .bind(token)
            .run();
        }
      } catch (e) {
        await db
          .prepare('UPDATE users SET session_token = ? WHERE id = ?')
          .bind(createToken(), user.id)
          .run();
      }
    } else {
      await db
        .prepare('UPDATE users SET session_token = ? WHERE id = ?')
        .bind(createToken(), user.id)
        .run();
    }
  }

  return response;
}
