import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { ALL_NEW_CONTENT_KEYS } from '../../../../lib/notificationSections';
import { ALL_ADMIN_EVENT_KEYS } from '../../../../lib/adminNotificationEvents';

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
  const rsvpEnabled = payload.rsvpEnabled !== undefined ? (payload.rsvpEnabled ? 1 : 0) : 1;
  const likeEnabled = payload.likeEnabled !== undefined ? (payload.likeEnabled ? 1 : 0) : 1;
  const updateEnabled = payload.updateEnabled !== undefined ? (payload.updateEnabled ? 1 : 0) : 1;
  const mentionEnabled = payload.mentionEnabled !== undefined ? (payload.mentionEnabled ? 1 : 0) : 1;
  const replyEnabled = payload.replyEnabled !== undefined ? (payload.replyEnabled ? 1 : 0) : 1;
  const commentEnabled = payload.commentEnabled !== undefined ? (payload.commentEnabled ? 1 : 0) : 1;
  const newForumThreadsEnabled = payload.newForumThreadsEnabled !== undefined ? (payload.newForumThreadsEnabled ? 1 : 0) : 0;
  const nomadActivityEnabled = payload.nomadActivityEnabled !== undefined ? (payload.nomadActivityEnabled ? 1 : 0) : 0;
  const adminNewUserEnabled = user.role === 'admin'
    ? (payload.adminNewUserEnabled ? 1 : 0)
    : null;
  const adminNewPostEnabled = user.role === 'admin'
    ? (payload.adminNewPostEnabled ? 1 : 0)
    : null;
  const adminNewReplyEnabled = user.role === 'admin'
    ? (payload.adminNewReplyEnabled ? 1 : 0)
    : null;

  const rawSections = payload.newForumThreadSections;
  const sectionsObj = typeof rawSections === 'object' && rawSections !== null
    ? Object.fromEntries(
        ALL_NEW_CONTENT_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(rawSections, k)).map((k) => [
          k,
          !!rawSections[k]
        ])
      )
    : {};
  const newContentSectionsJson = JSON.stringify(sectionsObj);

  const rawAdminEvents = user.role === 'admin' ? payload.adminEvents : {};
  const adminEventsObj = typeof rawAdminEvents === 'object' && rawAdminEvents !== null
    ? Object.fromEntries(
        ALL_ADMIN_EVENT_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(rawAdminEvents, k)).map((k) => [
          k,
          !!rawAdminEvents[k]
        ])
      )
    : {};
  const notifyAdminEventsJson = JSON.stringify(adminEventsObj);

  if (emailEnabled && !user.email) {
    return NextResponse.json({ error: 'Set an email before enabling email notifications.' }, { status: 400 });
  }
  if (smsEnabled && !user.phone) {
    return NextResponse.json({ error: 'Set a phone number before enabling SMS notifications.' }, { status: 400 });
  }

  const db = await getDb();
  const adminUpdateSql = user.role === 'admin'
    ? ', notify_admin_new_user_enabled = ?, notify_admin_new_post_enabled = ?, notify_admin_new_reply_enabled = ?, notify_admin_events = ?'
    : ', notify_admin_events = ?';

  const params = [
    emailEnabled,
    smsEnabled,
    rsvpEnabled,
    likeEnabled,
    updateEnabled,
    mentionEnabled,
    replyEnabled,
    commentEnabled,
    newForumThreadsEnabled,
    nomadActivityEnabled,
    newContentSectionsJson
  ];

  if (user.role === 'admin') {
    params.push(adminNewUserEnabled, adminNewPostEnabled, adminNewReplyEnabled, notifyAdminEventsJson);
  } else {
    params.push('{}');
  }
  params.push(user.id);

  await db
    .prepare(`
      UPDATE users 
      SET notify_email_enabled = ?, 
          notify_sms_enabled = ?,
          notify_rsvp_enabled = ?,
          notify_like_enabled = ?,
          notify_update_enabled = ?,
          notify_mention_enabled = ?,
          notify_reply_enabled = ?,
          notify_comment_enabled = ?,
          notify_new_forum_threads_enabled = ?,
          notify_nomad_activity_enabled = ?,
          notify_new_content_sections = ?${adminUpdateSql}
      WHERE id = ?
    `)
    .bind(...params)
    .run();

  return NextResponse.json({ 
    ok: true, 
    notifyEmailEnabled: !!emailEnabled, 
    notifySmsEnabled: !!smsEnabled,
    notifyRsvpEnabled: !!rsvpEnabled,
    notifyLikeEnabled: !!likeEnabled,
    notifyUpdateEnabled: !!updateEnabled,
    notifyMentionEnabled: !!mentionEnabled,
    notifyReplyEnabled: !!replyEnabled,
    notifyCommentEnabled: !!commentEnabled,
    notifyNewForumThreadsEnabled: !!newForumThreadsEnabled,
    notifyNomadActivityEnabled: !!nomadActivityEnabled,
    notifyNewContentSections: sectionsObj,
    notifyAdminNewUserEnabled: user.role === 'admin' ? !!adminNewUserEnabled : false,
    notifyAdminNewPostEnabled: user.role === 'admin' ? !!adminNewPostEnabled : false,
    notifyAdminNewReplyEnabled: user.role === 'admin' ? !!adminNewReplyEnabled : false,
    notifyAdminEvents: user.role === 'admin' ? adminEventsObj : {}
  });
}
