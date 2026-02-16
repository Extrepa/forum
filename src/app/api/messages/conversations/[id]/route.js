import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { insertNotificationWithOptionalSubId } from '../../../../../lib/notificationCleanup';
import { deleteNotificationsForTarget } from '../../../../../lib/notificationCleanup';
import { sendOutboundNotification } from '../../../../../lib/outboundNotifications';

/** GET /api/messages/conversations/[id] - Get conversation + messages */
export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });
  }

  const db = await getDb();

  const participant = await db
    .prepare(
      'SELECT 1 FROM dm_participants WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL'
    )
    .bind(id, user.id)
    .first();

  if (!participant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const conv = await db
    .prepare('SELECT id, type, subject, created_at, updated_at FROM dm_conversations WHERE id = ?')
    .bind(id)
    .first();

  if (!conv) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { results: participants } = await db
    .prepare(
      `SELECT u.id, u.username, u.preferred_username_color_index
       FROM dm_participants p
       JOIN users u ON u.id = p.user_id
       WHERE p.conversation_id = ? AND p.left_at IS NULL`
    )
    .bind(id)
    .all();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const before = searchParams.get('before');

  let messagesQuery = `SELECT m.id, m.body, m.created_at, m.author_user_id,
        u.username AS author_username, u.preferred_username_color_index AS author_color_preference
       FROM dm_messages m
       JOIN users u ON u.id = m.author_user_id
       WHERE m.conversation_id = ? AND m.is_deleted = 0`;
  const binds = [id];

  if (before) {
    messagesQuery += ' AND m.created_at < ?';
    binds.push(parseInt(before, 10));
  }
  messagesQuery += ' ORDER BY m.created_at DESC LIMIT ?';
  binds.push(limit);

  const { results: messages } = await db.prepare(messagesQuery).bind(...binds).all();
  const sorted = (messages || []).reverse();

  let displayName = conv.subject;
  if (!displayName && conv.type === 'direct' && participants?.length === 2) {
    const other = participants.find((p) => p.id !== user.id);
    displayName = other?.username || 'Direct message';
  } else if (!displayName && participants?.length) {
    displayName = participants.map((p) => p.username).join(', ');
  }

  return NextResponse.json({
    conversation: {
      id: conv.id,
      type: conv.type,
      subject: conv.subject,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      display_name: displayName,
      participants: participants || [],
    },
    messages: sorted,
  });
}

/** POST /api/messages/conversations/[id] - Send message */
export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const messageBody = String(body.body || '').trim();
  if (!messageBody) {
    return NextResponse.json({ error: 'Message body required' }, { status: 400 });
  }

  const db = await getDb();

  const participant = await db
    .prepare(
      'SELECT 1 FROM dm_participants WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL'
    )
    .bind(id, user.id)
    .first();

  if (!participant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const conv = await db
    .prepare('SELECT id, type FROM dm_conversations WHERE id = ?')
    .bind(id)
    .first();

  if (!conv) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const now = Date.now();
  const messageId = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO dm_messages (id, conversation_id, author_user_id, body, created_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, 0)`
    )
    .bind(messageId, id, user.id, messageBody, now)
    .run();

  await db
    .prepare('UPDATE dm_conversations SET updated_at = ? WHERE id = ?')
    .bind(now, id)
    .run();

  // Notify other participants
  const { results: otherParticipants } = await db
    .prepare(
      `SELECT p.user_id, u.email, u.phone, u.notify_email_enabled, u.notify_sms_enabled, u.notify_private_message_enabled
       FROM dm_participants p
       JOIN users u ON u.id = p.user_id
       WHERE p.conversation_id = ? AND p.user_id != ? AND p.left_at IS NULL`
    )
    .bind(id, user.id)
    .all();

  const actorUsername = user.username || 'Someone';

  for (const p of otherParticipants || []) {
    await insertNotificationWithOptionalSubId(db, {
      id: crypto.randomUUID(),
      user_id: p.user_id,
      actor_user_id: user.id,
      type: 'private_message',
      target_type: 'dm_conversation',
      target_id: id,
      created_at: now,
      target_sub_id: messageId,
    });

    try {
      await sendOutboundNotification({
        requestUrl: request.url,
        recipient: p,
        actorUsername,
        type: 'private_message',
        targetType: 'dm_conversation',
        targetId: id,
        targetTitle: null,
        bodySnippet: messageBody,
        typeEnabled: !!p.notify_private_message_enabled,
      });
    } catch (e) {
      // ignore outbound failures
    }
  }

  const { results: authorRow } = await db
    .prepare(
      'SELECT u.username, u.preferred_username_color_index FROM users u WHERE u.id = ?'
    )
    .bind(user.id)
    .all();

  const author = authorRow?.[0];

  return NextResponse.json({
    message: {
      id: messageId,
      body: messageBody,
      created_at: now,
      author_user_id: user.id,
      author_username: author?.username || user.username,
      author_color_preference: author?.preferred_username_color_index,
    },
  });
}

/** DELETE /api/messages/conversations/[id] - Admin only: delete conversation and clean up notifications */
export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });
  }

  const db = await getDb();

  const conv = await db.prepare('SELECT id FROM dm_conversations WHERE id = ?').bind(id).first();
  if (!conv) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const now = Date.now();
  let participants = [];
  try {
    const r = await db
      .prepare(
        `SELECT p.user_id, u.notify_conversation_updates_enabled
         FROM dm_participants p
         JOIN users u ON u.id = p.user_id
         WHERE p.conversation_id = ?`
      )
      .bind(id)
      .all();
    participants = r.results || [];
  } catch (_) {
    const r = await db
      .prepare('SELECT p.user_id FROM dm_participants p WHERE p.conversation_id = ?')
      .bind(id)
      .all();
    participants = (r.results || []).map((p) => ({ user_id: p.user_id, notify_conversation_updates_enabled: 1 }));
  }

  for (const p of participants) {
    if (p.notify_conversation_updates_enabled) {
      try {
        await insertNotificationWithOptionalSubId(db, {
          id: randomUUID(),
          user_id: p.user_id,
          actor_user_id: user.id,
          type: 'conversation_deleted',
          target_type: 'dm_conversation_deleted',
          target_id: id,
          created_at: now,
        });
      } catch (e) {
        // ignore
      }
    }
  }

  await db.prepare('DELETE FROM dm_messages WHERE conversation_id = ?').bind(id).run();
  await db.prepare('DELETE FROM dm_participants WHERE conversation_id = ?').bind(id).run();
  await db.prepare('DELETE FROM dm_conversations WHERE id = ?').bind(id).run();
  await deleteNotificationsForTarget(db, 'dm_conversation', id);

  return NextResponse.json({ ok: true });
}
