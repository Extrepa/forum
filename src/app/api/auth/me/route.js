import { NextResponse } from 'next/server';
import { getSessionUser } from '../../../../lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email ?? null,
      mustChangePassword: !!user.must_change_password,
      notifyEmailEnabled: !!user.notify_email_enabled,
      notifySmsEnabled: !!user.notify_sms_enabled
    }
  });
}

