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

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    // Optional body
  }
  const type = String(body.type || '').trim();
  if (!type || !CONTENT_TYPE_KEYS.includes(type)) {
    return NextResponse.json({ error: 'Invalid type. Use one of: ' + CONTENT_TYPE_KEYS.join(', ') }, { status: 400 });
  }

  const table = contentTypeTable(type);
  if (!table) {
    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  }

  const db = await getDb();
  try {
    const row = await db
      .prepare(`SELECT id, is_pinned FROM ${table} WHERE id = ?`)
      .bind(id)
      .first();

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const nextPinned = row.is_pinned ? 0 : 1;
    await db
      .prepare(`UPDATE ${table} SET is_pinned = ? WHERE id = ?`)
      .bind(nextPinned, id)
      .run();

    if (isAdminUser(user)) {
      await logAdminAction({
        adminUserId: user.id,
        actionType: 'toggle_pin',
        targetType: type,
        targetId: id,
        metadata: { pinned: nextPinned === 1 }
      });
    }

    return NextResponse.json({ id, type, is_pinned: nextPinned === 1 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to toggle pin' }, { status: 500 });
  }
}
