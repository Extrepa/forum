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

  const emailEnabled = payload.emailEnabled ? 1 : 0;
  const smsEnabled = payload.smsEnabled ? 1 : 0;

  if (emailEnabled && !user.email) {
    return NextResponse.json({ error: 'Set an email before enabling email notifications.' }, { status: 400 });
  }
  if (smsEnabled && !user.phone) {
    return NextResponse.json({ error: 'Set a phone number before enabling SMS notifications.' }, { status: 400 });
  }

  const db = await getDb();
  await db
    .prepare('UPDATE users SET notify_email_enabled = ?, notify_sms_enabled = ? WHERE id = ?')
    .bind(emailEnabled, smsEnabled, user.id)
    .run();

  return NextResponse.json({ ok: true, notifyEmailEnabled: !!emailEnabled, notifySmsEnabled: !!smsEnabled });
}

