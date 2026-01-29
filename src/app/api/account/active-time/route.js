import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

const MINUTE_MS = 60 * 1000;

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDb();
    const now = Date.now();

    try {
      const row = await db
        .prepare('SELECT time_tracking_last_seen FROM users WHERE id = ?')
        .bind(user.id)
        .first();

      const lastSeen = row?.time_tracking_last_seen || 0;
      const minutesToAdd = lastSeen > 0 ? Math.floor((now - lastSeen) / MINUTE_MS) : 0;

      if (minutesToAdd > 0) {
        const threshold = now - MINUTE_MS;
        await db
          .prepare(
            'UPDATE users SET time_spent_minutes = COALESCE(time_spent_minutes, 0) + ?, time_tracking_last_seen = ? WHERE id = ? AND (time_tracking_last_seen IS NULL OR time_tracking_last_seen <= ?)'
          )
          .bind(minutesToAdd, now, user.id, threshold)
          .run();
      } else {
        await db
          .prepare('UPDATE users SET time_tracking_last_seen = ? WHERE id = ?')
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
