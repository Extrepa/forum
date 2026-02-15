import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (_) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const message = String(payload?.message || '').trim();
  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }
  if (message.length > 280) {
    return NextResponse.json({ error: 'Message must be 280 characters or fewer.' }, { status: 400 });
  }

  const db = await getDb();

  try {
    let allUsers = [];
    try {
      const { results } = await db
        .prepare('SELECT id FROM users WHERE is_deleted = 0 OR is_deleted IS NULL')
        .all();
      allUsers = results || [];
    } catch (_) {
      const { results } = await db
        .prepare('SELECT id FROM users')
        .all();
      allUsers = results || [];
    }

    const now = Date.now();
    let sent = 0;
    for (const targetUser of allUsers) {
      if (!targetUser?.id) continue;
      await db
        .prepare(
          `INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          crypto.randomUUID(),
          targetUser.id,
          user.id,
          'broadcast',
          'system',
          message,
          now
        )
        .run();
      sent += 1;
    }

    return NextResponse.json({
      success: true,
      sent,
      message: `Broadcast sent to ${sent} users.`
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to send broadcast notification.',
      details: String(error)
    }, { status: 500 });
  }
}
