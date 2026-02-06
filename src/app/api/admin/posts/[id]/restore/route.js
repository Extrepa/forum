import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../lib/db';
import { getSessionUser } from '../../../../../../lib/auth';
import { isAdminUser } from '../../../../../../lib/admin';
import { logAdminAction } from '../../../../../../lib/audit';
import { CONTENT_TYPE_KEYS, contentTypeTable } from '../../../../../../lib/contentTypes';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (e) {
    payload = {};
  }

  const type = String(payload.type || '').trim();
  if (!type || !CONTENT_TYPE_KEYS.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const table = contentTypeTable(type);
  if (!table) {
    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  }

  const db = await getDb();
  const existing = await db.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(id).first();
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const now = Date.now();
  try {
    await db
      .prepare(`UPDATE ${table} SET is_deleted = 0, updated_at = ? WHERE id = ?`)
      .bind(now, id)
      .run();
  } catch (e) {
    await db
      .prepare(`UPDATE ${table} SET is_deleted = 0 WHERE id = ?`)
      .bind(id)
      .run();
  }

  await logAdminAction({
    adminUserId: user.id,
    actionType: 'restore_post',
    targetType: type,
    targetId: id
  });

  return NextResponse.json({ ok: true, id, type });
}
