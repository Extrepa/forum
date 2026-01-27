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
      notifyRsvpEnabled: user.notify_rsvp_enabled !== 0,
      notifyLikeEnabled: user.notify_like_enabled !== 0,
      notifyUpdateEnabled: user.notify_update_enabled !== 0,
      notifyMentionEnabled: user.notify_mention_enabled !== 0,
      notifyReplyEnabled: user.notify_reply_enabled !== 0,
      notifyCommentEnabled: user.notify_comment_enabled !== 0,
      uiLoreEnabled: !!user.ui_lore_enabled,
      defaultLandingPage: user.default_landing_page ?? 'home',
      preferredUsernameColorIndex: user.preferred_username_color_index ?? null
    }
  });
}

