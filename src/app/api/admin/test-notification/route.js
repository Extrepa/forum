import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { isAdminUser } from '../../../../lib/admin';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = await getDb();

  let payload = {};
  try {
    payload = await request.json();
  } catch (_) {
    // Allow empty body.
  }

  const kind = String(payload?.kind || 'navigation_tip').trim().toLowerCase();
  const now = Date.now();

  try {
    const { results: allUsers } = await db
      .prepare('SELECT id FROM users')
      .all();

    if (kind === 'test') {
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
        kind: 'test',
        message: `Test notification created for ${allUsers?.length || 0} users`
      });
    }

    const tipType = 'navigation_tip';
    const tipTargetType = 'system';
    const tipTargetId = 'header_messages_and_kebab_v1';

    const { results: existingTips } = await db
      .prepare('SELECT user_id FROM notifications WHERE type = ? AND target_type = ? AND target_id = ?')
      .bind(tipType, tipTargetType, tipTargetId)
      .all();

    const alreadySent = new Set((existingTips || []).map((row) => row.user_id));
    let inserted = 0;

    for (const u of allUsers || []) {
      if (!u?.id || alreadySent.has(u.id)) continue;
      await db
        .prepare(
          'INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          crypto.randomUUID(),
          u.id,
          user.id,
          tipType,
          tipTargetType,
          tipTargetId,
          now
        )
        .run();
      inserted += 1;
    }

    return NextResponse.json({
      success: true,
      kind: 'navigation_tip',
      inserted,
      skippedExisting: (allUsers?.length || 0) - inserted,
      message: `Navigation tip notification sent to ${inserted} users (${(allUsers?.length || 0) - inserted} already had it).`
    });
  } catch (e) {
    return NextResponse.json({
      error: 'Failed to create notification broadcast',
      details: String(e)
    }, { status: 500 });
  }
}
