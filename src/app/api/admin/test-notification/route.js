import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { isAdminUser } from '../../../../lib/admin';

export async function POST() {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = await getDb();
  
  try {
    // Create test notification for all users
    const { results: allUsers } = await db
      .prepare('SELECT id FROM users')
      .all();

    const now = Date.now();
    for (const u of allUsers || []) {
      await db
        .prepare(
          'INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          crypto.randomUUID(),
          u.id,
          user.id,
          'test',
          'system',
          'test',
          now
        )
        .run();
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test notification created for ${allUsers?.length || 0} users` 
    });
  } catch (e) {
    return NextResponse.json({ 
      error: 'Failed to create test notification',
      details: String(e)
    }, { status: 500 });
  }
}
