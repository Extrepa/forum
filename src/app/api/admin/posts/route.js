import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { isAdminUser } from '../../../../lib/admin';
import { CONTENT_TYPE_KEYS, contentTypeTable } from '../../../../lib/contentTypes';

export async function GET(request) {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'forum_thread';
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

  if (!CONTENT_TYPE_KEYS.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const db = await getDb();
  try {
    const table = contentTypeTable(type);
    if (!table) {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }

    const result = await db
      .prepare(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(limit, offset)
      .all();
    const items = (result?.results || []).map((row) => ({
      ...row,
      _type: type
    }));

    return NextResponse.json({ items, type, limit, offset });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
