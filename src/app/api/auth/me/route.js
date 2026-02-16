import { NextResponse } from 'next/server';
import { getSessionUser } from '../../../../lib/auth';
import { getEdgeContext } from '../../../../lib/edgeContext';
import { parseNewContentSectionsJson } from '../../../../lib/notificationSections';
import { parseAdminEventsJson } from '../../../../lib/adminNotificationEvents';

export async function GET(request) {
  const url = new URL(request.url);
  const debug = url.searchParams.get('debug') === '1';
  const { requestId } = await getEdgeContext();
  if (requestId) {
    console.info('edge-request', { route: '/api/auth/me', requestId });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({
      user: null,
      ...(debug ? { requestId } : {})
    });
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
      notifyPrivateMessageEnabled: user.notify_private_message_enabled !== 0,
      notifyConversationUpdatesEnabled: (user.notify_conversation_updates_enabled ?? 1) !== 0,
      notifyNewForumThreadsEnabled: user.notify_new_forum_threads_enabled !== 0,
      notifyNomadActivityEnabled: user.notify_nomad_activity_enabled !== 0,
      notifyNewContentSections: parseNewContentSectionsJson(user.notify_new_content_sections),
      notifyAdminNewUserEnabled: user.notify_admin_new_user_enabled !== 0,
      notifyAdminNewPostEnabled: user.notify_admin_new_post_enabled !== 0,
      notifyAdminNewReplyEnabled: user.notify_admin_new_reply_enabled !== 0,
      notifyAdminEvents: parseAdminEventsJson(user.notify_admin_events),
      uiLoreEnabled: !!user.ui_lore_enabled,
      uiColorMode: user.ui_color_mode ?? 0,
      uiBorderColor: user.ui_border_color ?? null,
      uiInvertColors: !!user.ui_invert_colors,
      defaultLandingPage: user.default_landing_page ?? 'home',
      preferredUsernameColorIndex: user.preferred_username_color_index ?? null
    },
    ...(debug ? { requestId } : {})
  });
}
