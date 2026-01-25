import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();

  try {
    // Delete all notifications for this user
    await db
      .prepare('DELETE FROM notifications WHERE user_id = ?')
      .bind(user.id)
      .run();
  } catch (e) {
    return NextResponse.json({ error: 'Failed to clear notifications.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, unreadCount: 0 });
}
