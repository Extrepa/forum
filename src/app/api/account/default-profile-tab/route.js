import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

const VALID_TABS = ['none', 'stats', 'activity', 'socials', 'gallery', 'guestbook'];

export async function POST(request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const tab = typeof body.default_profile_tab === 'string' ? body.default_profile_tab.trim().toLowerCase() : '';
  const value = tab && VALID_TABS.includes(tab) ? tab : null;

  const db = await getDb();
  try {
    await db
      .prepare('UPDATE users SET default_profile_tab = ? WHERE id = ?')
      .bind(value, user.id)
      .run();
    return NextResponse.json({ success: true, default_profile_tab: value });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
