import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to update preferences.' }, { status: 401 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const landingPage = String(payload.landingPage || '').trim();
  if (landingPage !== 'home' && landingPage !== 'feed') {
    return NextResponse.json({ error: 'Landing page must be "home" or "feed".' }, { status: 400 });
  }

  const db = await getDb();
  try {
    await db
      .prepare('UPDATE users SET default_landing_page = ? WHERE id = ?')
      .bind(landingPage, user.id)
      .run();
  } catch (e) {
    // Column might not exist yet (migration not applied)
    return NextResponse.json(
      { error: 'Landing page preference is not available yet (database updates still applying).' },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, landingPage });
}
