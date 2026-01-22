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
      phone: user.phone ?? null,
      hasPassword: !!user.password_hash,
      notifyEmailEnabled: !!user.notify_email_enabled,
      notifySmsEnabled: !!user.notify_sms_enabled,
      uiLoreEnabled: !!user.ui_lore_enabled,
      defaultLandingPage: user.default_landing_page ?? 'home'
    }
  });
}

