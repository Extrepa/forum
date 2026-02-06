import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { CONTENT_TYPE_KEYS, contentTypeTable } from '../../../../../lib/contentTypes';

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const type = new URL(request.url).searchParams.get('type') || 'forum_thread';

  if (!id || !CONTENT_TYPE_KEYS.includes(type)) {
    return NextResponse.json({ error: 'Missing id or invalid type' }, { status: 400 });
  }

  const table = contentTypeTable(type);
  const db = await getDb();

  try {
    const row = await db
      .prepare(`SELECT * FROM ${table} WHERE id = ?`)
      .bind(id)
      .first();

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ...row, _type: type });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = String(body.type || '').trim();
  if (!id || !type || !CONTENT_TYPE_KEYS.includes(type)) {
    return NextResponse.json({ error: 'Missing id or invalid type' }, { status: 400 });
  }

  const table = contentTypeTable(type);
  const db = await getDb();
  const now = Date.now();

  try {
    const existing = await db.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(id).first();
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updates = [];
    const values = [];
    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(String(body.title ?? ''));
    }
    if (body.body !== undefined) {
      updates.push('body = ?');
      values.push(String(body.body ?? ''));
    }
    if (body.details !== undefined && type === 'event') {
      updates.push('details = ?');
      values.push(String(body.details ?? ''));
    }
    if (updates.length > 0) {
      updates.push('edited_at = ?', 'updated_by_user_id = ?');
      values.push(now, user.id);
      values.push(id);
      await db.prepare(`UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
    }

    const row = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
    return NextResponse.json({ ...row, _type: type });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const type = new URL(request.url).searchParams.get('type') || 'forum_thread';

  if (!id || !CONTENT_TYPE_KEYS.includes(type)) {
    return NextResponse.json({ error: 'Missing id or invalid type' }, { status: 400 });
  }

  const table = contentTypeTable(type);
  const db = await getDb();

  try {
    const existing = await db.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(id).first();
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db
      .prepare(`UPDATE ${table} SET is_deleted = 1, edited_at = ?, updated_by_user_id = ? WHERE id = ?`)
      .bind(Date.now(), user.id, id)
      .run();

    return NextResponse.json({ ok: true, id, type });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to soft delete' }, { status: 500 });
  }
}
