import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { canMessageByRole } from '../../../../../lib/roles';
import { insertNotificationWithOptionalSubId } from '../../../../../lib/notificationCleanup';
import { sendOutboundNotification } from '../../../../../lib/outboundNotifications';

/**
 * POST /api/messages/conversations/create
 * Body: { participantIds: string[], subject?: string, body?: string, broadcastRole?: string }
 * - participantIds: user IDs to message (1 for direct, 2+ for group)
 * - subject: optional, for group conversations
 * - body: optional first message
 * - broadcastRole: admin only - 'user'|'drip_nomad'|'mod'|'admin'|'all' to send to all users with that role
 */
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  let participantIds = Array.isArray(body.participantIds) ? body.participantIds : [];
  const subject = String(body.subject || '').trim() || null;
  const firstMessage = String(body.body || '').trim() || null;
  const broadcastRole = body.broadcastRole ? String(body.broadcastRole).trim() : null;

  const db = await getDb();

  // Admin broadcast: resolve role to user IDs
  if (broadcastRole && isAdminUser(user)) {
    let roleFilter = 'role = ?';
    const roleBind = [broadcastRole === 'all' ? null : broadcastRole];

    const roleMap = { user: 'user', drip_nomad: 'drip_nomad', mod: 'mod', admin: 'admin' };
    const validRole = roleMap[broadcastRole] || broadcastRole;

    const { results } = await db
      .prepare(
        `SELECT id FROM users WHERE (is_deleted = 0 OR is_deleted IS NULL) AND id != ?
         ${validRole && validRole !== 'all' ? 'AND role = ?' : ''}`
      )
      .bind(user.id, ...(validRole && validRole !== 'all' ? [validRole] : []))
      .all();

    participantIds = (results || []).map((r) => r.id);
  }

  if (participantIds.length === 0) {
    return NextResponse.json({ error: 'At least one recipient required' }, { status: 400 });
  }

  // Dedupe and exclude self
  const uniqueRecipients = [...new Set(participantIds)].filter((id) => id !== user.id);
  if (uniqueRecipients.length === 0) {
    return NextResponse.json({ error: 'Cannot start conversation with only yourself' }, { status: 400 });
  }

  // Role check: sender can only message users within their allowed role tier
  // (Driplets -> Driplets only; Nomads -> Driplets + Nomads; Mods -> up to Mods; Admins -> all)
  const { results: recipientRows } = await db
    .prepare(
      `SELECT id, role FROM users WHERE id IN (${uniqueRecipients.map(() => '?').join(',')}) AND (is_deleted = 0 OR is_deleted IS NULL)`
    )
    .bind(...uniqueRecipients)
    .all();

  const validRecipientIds = new Set((recipientRows || []).map((r) => r.id));
  if (validRecipientIds.size < uniqueRecipients.length) {
    return NextResponse.json({ error: 'One or more recipients could not be found.' }, { status: 400 });
  }

  for (const r of recipientRows || []) {
    if (!canMessageByRole(user.role || 'user', r.role)) {
      return NextResponse.json({ error: 'You cannot message one or more of the selected recipients based on your role.' }, { status: 403 });
    }
  }

  const type = uniqueRecipients.length === 1 && !subject && !broadcastRole ? 'direct' : 'group';

  // For direct: check if conversation already exists
  if (type === 'direct') {
    const otherId = uniqueRecipients[0];
    const existing = await db
      .prepare(
        `SELECT c.id FROM dm_conversations c
         JOIN dm_participants p1 ON p1.conversation_id = c.id AND p1.user_id = ? AND p1.left_at IS NULL
         JOIN dm_participants p2 ON p2.conversation_id = c.id AND p2.user_id = ? AND p2.left_at IS NULL
         WHERE c.type = 'direct'`
      )
      .bind(user.id, otherId)
      .first();

    if (existing) {
      // Validate role for existing conversation (roles may have changed)
      const otherUser = await db.prepare('SELECT role FROM users WHERE id = ?').bind(otherId).first();
      if (otherUser && !canMessageByRole(user.role || 'user', otherUser.role)) {
        return NextResponse.json({ error: 'You cannot message this user based on your role.' }, { status: 403 });
      }
      if (firstMessage) {
        const now = Date.now();
        const messageId = crypto.randomUUID();
        await db
          .prepare(
            `INSERT INTO dm_messages (id, conversation_id, author_user_id, body, created_at, is_deleted)
             VALUES (?, ?, ?, ?, ?, 0)`
          )
          .bind(messageId, existing.id, user.id, firstMessage, now)
          .run();
        await db
          .prepare('UPDATE dm_conversations SET updated_at = ? WHERE id = ?')
          .bind(now, existing.id)
          .run();
        await insertNotificationWithOptionalSubId(db, {
          id: crypto.randomUUID(),
          user_id: otherId,
          actor_user_id: user.id,
          type: 'private_message',
          target_type: 'dm_conversation',
          target_id: existing.id,
          created_at: now,
          target_sub_id: messageId,
        });
        try {
          const other = await db
            .prepare('SELECT email, phone, notify_email_enabled, notify_sms_enabled, notify_private_message_enabled FROM users WHERE id = ?')
            .bind(otherId)
            .first();
          await sendOutboundNotification({
            requestUrl: request.url,
            recipient: other,
            actorUsername: user.username || 'Someone',
            type: 'private_message',
            targetType: 'dm_conversation',
            targetId: existing.id,
            targetTitle: null,
            bodySnippet: firstMessage,
            typeEnabled: !!other?.notify_private_message_enabled,
          });
        } catch (e) {
          // ignore
        }
      }
      return NextResponse.json({ conversationId: existing.id, existing: true });
    }
  }

  const now = Date.now();
  const conversationId = crypto.randomUUID();

  await db
    .prepare(
      'INSERT INTO dm_conversations (id, type, subject, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(conversationId, type, subject, now, now)
    .run();

  await db
    .prepare(
      'INSERT INTO dm_participants (conversation_id, user_id, joined_at) VALUES (?, ?, ?)'
    )
    .bind(conversationId, user.id, now)
    .run();

  for (const uid of uniqueRecipients) {
    await db
      .prepare(
        'INSERT INTO dm_participants (conversation_id, user_id, joined_at) VALUES (?, ?, ?)'
      )
      .bind(conversationId, uid, now)
      .run();
  }

  if (firstMessage) {
    const messageId = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO dm_messages (id, conversation_id, author_user_id, body, created_at, is_deleted)
         VALUES (?, ?, ?, ?, ?, 0)`
      )
      .bind(messageId, conversationId, user.id, firstMessage, now)
      .run();

    const actorUsername = user.username || 'Someone';
    for (const uid of uniqueRecipients) {
      await insertNotificationWithOptionalSubId(db, {
        id: crypto.randomUUID(),
        user_id: uid,
        actor_user_id: user.id,
        type: 'private_message',
        target_type: 'dm_conversation',
        target_id: conversationId,
        created_at: now,
        target_sub_id: messageId,
      });
      try {
        const recipient = await db
          .prepare('SELECT email, phone, notify_email_enabled, notify_sms_enabled, notify_private_message_enabled FROM users WHERE id = ?')
          .bind(uid)
          .first();
        await sendOutboundNotification({
          requestUrl: request.url,
          recipient: recipient || {},
          actorUsername,
          type: 'private_message',
          targetType: 'dm_conversation',
          targetId: conversationId,
          targetTitle: null,
          bodySnippet: firstMessage,
          typeEnabled: !!recipient?.notify_private_message_enabled,
        });
      } catch (e) {
        // ignore
      }
    }
  }

  return NextResponse.json({ conversationId, existing: false });
}
