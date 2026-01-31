import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

const MINUTE_MS = 60 * 1000;
const MAX_MINUTES_PER_PING = 2;

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDb();
    const now = Date.now();
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    const isInitial = Boolean(body?.initial);

    try {
      const row = await db
        .prepare('SELECT avatar_edit_last_seen FROM users WHERE id = ?')
        .bind(user.id)
        .first();

      const lastSeen = Number(row?.avatar_edit_last_seen || 0);
      if (lastSeen <= 0) {
        await db
          .prepare('UPDATE users SET avatar_edit_last_seen = ? WHERE id = ?')
          .bind(now, user.id)
          .run();
        return NextResponse.json({ ok: true, minutesAdded: 0 });
      }

      const elapsedMs = Math.max(0, now - lastSeen);
      const rawMinutes = Math.floor(elapsedMs / MINUTE_MS);
      const minutesToAdd = Math.min(MAX_MINUTES_PER_PING, rawMinutes);

      if (isInitial) {
        await db
          .prepare('UPDATE users SET avatar_edit_last_seen = ? WHERE id = ?')
          .bind(now, user.id)
          .run();
        return NextResponse.json({ ok: true, minutesAdded: 0 });
      }

      if (minutesToAdd > 0) {
        const threshold = now - MINUTE_MS;
        await db
          .prepare(
            'UPDATE users SET avatar_edit_minutes = COALESCE(avatar_edit_minutes, 0) + ?, avatar_edit_last_seen = ? WHERE id = ? AND (avatar_edit_last_seen IS NULL OR avatar_edit_last_seen <= ?)'
          )
          .bind(minutesToAdd, now, user.id, threshold)
          .run();
      } else {
        await db
          .prepare('UPDATE users SET avatar_edit_last_seen = ? WHERE id = ?')
          .bind(now, user.id)
          .run();
      }

      return NextResponse.json({ ok: true, minutesAdded: minutesToAdd });
    } catch (e) {
      // Columns might not exist yet if migration hasn't run.
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    return NextResponse.json({ ok: true });
  }
}
