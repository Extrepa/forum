import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../lib/db';
import { getSessionUser } from '../../../../../../lib/auth';
import { insertNotificationWithOptionalSubId } from '../../../../../../lib/notificationCleanup';
import { randomUUID } from 'crypto';

/** POST /api/messages/conversations/[id]/leave - Leave a conversation */
export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });
  }

  const db = await getDb();
  const now = Date.now();

  const participant = await db
    .prepare(
      'SELECT 1 FROM dm_participants WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL'
    )
    .bind(id, user.id)
    .first();

  if (!participant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let others = [];
  try {
    const r = await db
      .prepare(
        `SELECT p.user_id, u.notify_conversation_updates_enabled
         FROM dm_participants p
         JOIN users u ON u.id = p.user_id
         WHERE p.conversation_id = ? AND p.user_id != ? AND p.left_at IS NULL`
      )
      .bind(id, user.id)
      .all();
    others = r.results || [];
  } catch (_) {
    const r = await db
      .prepare('SELECT p.user_id FROM dm_participants p WHERE p.conversation_id = ? AND p.user_id != ? AND p.left_at IS NULL')
      .bind(id, user.id)
      .all();
    others = (r.results || []).map((o) => ({ user_id: o.user_id, notify_conversation_updates_enabled: 1 }));
  }

  await db
    .prepare('UPDATE dm_participants SET left_at = ? WHERE conversation_id = ? AND user_id = ?')
    .bind(now, id, user.id)
    .run();

  for (const o of others) {
    if (o.notify_conversation_updates_enabled) {
      try {
        await insertNotificationWithOptionalSubId(db, {
          id: randomUUID(),
          user_id: o.user_id,
          actor_user_id: user.id,
          type: 'conversation_participant_left',
          target_type: 'dm_conversation',
          target_id: id,
          created_at: now,
        });
      } catch (e) {
        // ignore
      }
    }
  }

  return NextResponse.json({ ok: true });
}
