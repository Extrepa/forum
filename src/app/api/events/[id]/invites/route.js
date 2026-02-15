import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !user.password_hash) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const db = await getDb();
  const event = await db
    .prepare('SELECT author_user_id FROM events WHERE id = ?')
    .bind(id)
    .first();

  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  }

  const canInvite = event.author_user_id === user.id || isAdminUser(user);
  if (!canInvite) {
    return NextResponse.json({ error: 'Only the event author can send invites.' }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const inviteAll = Boolean(payload?.invite_all);
  const roleGroups = Array.isArray(payload?.role_groups)
    ? payload.role_groups.map((v) => String(v || '').trim()).filter(Boolean)
    : [];
  const userIds = Array.isArray(payload?.user_ids)
    ? payload.user_ids.map((v) => String(v || '').trim()).filter(Boolean)
    : [];

  if (!inviteAll && roleGroups.length === 0 && userIds.length === 0) {
    return NextResponse.json({ error: 'Choose at least one user, role group, or all users.' }, { status: 400 });
  }

  const targetUserIds = new Set();

  if (inviteAll) {
    try {
      const out = await db
        .prepare('SELECT id FROM users WHERE (is_deleted = 0 OR is_deleted IS NULL)')
        .all();
      (out?.results || []).forEach((row) => {
        if (row?.id) targetUserIds.add(String(row.id));
      });
    } catch (e) {
      const out = await db.prepare('SELECT id FROM users').all();
      (out?.results || []).forEach((row) => {
        if (row?.id) targetUserIds.add(String(row.id));
      });
    }
  }

  if (roleGroups.length > 0) {
    const placeholders = roleGroups.map(() => '?').join(',');
    try {
      const out = await db
        .prepare(`SELECT id FROM users WHERE role IN (${placeholders}) AND (is_deleted = 0 OR is_deleted IS NULL)`)
        .bind(...roleGroups)
        .all();
      (out?.results || []).forEach((row) => {
        if (row?.id) targetUserIds.add(String(row.id));
      });
    } catch (e) {
      const out = await db
        .prepare(`SELECT id FROM users WHERE role IN (${placeholders})`)
        .bind(...roleGroups)
        .all();
      (out?.results || []).forEach((row) => {
        if (row?.id) targetUserIds.add(String(row.id));
      });
    }
  }

  if (userIds.length > 0) {
    const placeholders = userIds.map(() => '?').join(',');
    const out = await db
      .prepare(`SELECT id FROM users WHERE id IN (${placeholders})`)
      .bind(...userIds)
      .all();
    (out?.results || []).forEach((row) => {
      if (row?.id) targetUserIds.add(String(row.id));
    });
  }

  targetUserIds.delete(String(user.id));
  const allTargets = Array.from(targetUserIds);
  if (allTargets.length === 0) {
    return NextResponse.json({ sent_count: 0, already_invited_count: 0 });
  }

  let alreadyInvitedSet = new Set();
  {
    try {
      const placeholders = allTargets.map(() => '?').join(',');
      const out = await db
        .prepare(`SELECT invited_user_id FROM event_invites WHERE event_id = ? AND invited_user_id IN (${placeholders})`)
        .bind(id, ...allTargets)
        .all();
      alreadyInvitedSet = new Set((out?.results || []).map((row) => String(row.invited_user_id)));
    } catch (e) {
      alreadyInvitedSet = new Set();
    }
  }

  const newTargets = allTargets.filter((userId) => !alreadyInvitedSet.has(userId));
  let alreadyNotifiedSet = new Set();
  if (newTargets.length > 0) {
    try {
      const placeholders = newTargets.map(() => '?').join(',');
      const out = await db
        .prepare(
          `SELECT user_id
           FROM notifications
           WHERE type = ?
             AND target_type = ?
             AND target_id = ?
             AND user_id IN (${placeholders})`
        )
        .bind('event_invite', 'event', id, ...newTargets)
        .all();
      alreadyNotifiedSet = new Set((out?.results || []).map((row) => String(row.user_id)));
    } catch (e) {
      alreadyNotifiedSet = new Set();
    }
  }
  const finalTargets = newTargets.filter((userId) => !alreadyNotifiedSet.has(userId));
  const now = Date.now();

  for (const targetUserId of finalTargets) {
    try {
      await db
        .prepare(
          'INSERT INTO event_invites (id, event_id, invited_user_id, invited_by_user_id, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(crypto.randomUUID(), id, targetUserId, user.id, now)
        .run();
    } catch (e) {
      // Rollout-safe: event_invites table may not exist yet.
    }

    await db
      .prepare(
        'INSERT INTO notifications (id, user_id, actor_user_id, type, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(crypto.randomUUID(), targetUserId, user.id, 'event_invite', 'event', id, now)
      .run();
  }

  return NextResponse.json({
    sent_count: finalTargets.length,
    already_invited_count: allTargets.length - finalTargets.length,
  });
}
