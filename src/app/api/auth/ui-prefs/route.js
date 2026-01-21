import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const loreEnabled = payload.loreEnabled ? 1 : 0;

  const db = await getDb();
  try {
    await db.prepare('UPDATE users SET ui_lore_enabled = ? WHERE id = ?').bind(loreEnabled, user.id).run();
  } catch (error) {
    return NextResponse.json(
      { error: 'Lore preference is not available yet (missing migration).' },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, uiLoreEnabled: !!loreEnabled });
}

