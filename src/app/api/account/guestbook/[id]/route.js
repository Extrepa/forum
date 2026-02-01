import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSessionUser } from '../../../../../lib/auth';

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing entry id' }, { status: 400 });
  }

  const db = await getDb();
  const entry = await db
    .prepare('SELECT id, owner_user_id FROM guestbook_entries WHERE id = ?')
    .bind(id)
    .first();

  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  if (entry.owner_user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.prepare('DELETE FROM guestbook_entries WHERE id = ?').bind(id).run();

  return NextResponse.json({ success: true });
}
