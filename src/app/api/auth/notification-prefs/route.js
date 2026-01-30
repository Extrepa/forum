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
  const rsvpEnabled = payload.rsvpEnabled !== undefined ? (payload.rsvpEnabled ? 1 : 0) : 1;
  const likeEnabled = payload.likeEnabled !== undefined ? (payload.likeEnabled ? 1 : 0) : 1;
  const updateEnabled = payload.updateEnabled !== undefined ? (payload.updateEnabled ? 1 : 0) : 1;
  const mentionEnabled = payload.mentionEnabled !== undefined ? (payload.mentionEnabled ? 1 : 0) : 1;
  const replyEnabled = payload.replyEnabled !== undefined ? (payload.replyEnabled ? 1 : 0) : 1;
  const commentEnabled = payload.commentEnabled !== undefined ? (payload.commentEnabled ? 1 : 0) : 1;
  const adminNewUserEnabled = user.role === 'admin'
    ? (payload.adminNewUserEnabled ? 1 : 0)
    : null;
  const adminNewPostEnabled = user.role === 'admin'
    ? (payload.adminNewPostEnabled ? 1 : 0)
    : null;
  const adminNewReplyEnabled = user.role === 'admin'
    ? (payload.adminNewReplyEnabled ? 1 : 0)
    : null;

  if (emailEnabled && !user.email) {
    return NextResponse.json({ error: 'Set an email before enabling email notifications.' }, { status: 400 });
  }
  if (smsEnabled && !user.phone) {
    return NextResponse.json({ error: 'Set a phone number before enabling SMS notifications.' }, { status: 400 });
  }

  const db = await getDb();
  const adminUpdateSql = user.role === 'admin'
    ? ', notify_admin_new_user_enabled = ?, notify_admin_new_post_enabled = ?, notify_admin_new_reply_enabled = ?'
    : '';

  const params = [
    emailEnabled,
    smsEnabled,
    rsvpEnabled,
    likeEnabled,
    updateEnabled,
    mentionEnabled,
    replyEnabled,
    commentEnabled
  ];

  if (user.role === 'admin') {
    params.push(adminNewUserEnabled, adminNewPostEnabled, adminNewReplyEnabled);
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
          notify_comment_enabled = ?${adminUpdateSql}
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
    notifyAdminNewUserEnabled: user.role === 'admin' ? !!adminNewUserEnabled : false,
    notifyAdminNewPostEnabled: user.role === 'admin' ? !!adminNewPostEnabled : false,
    notifyAdminNewReplyEnabled: user.role === 'admin' ? !!adminNewReplyEnabled : false
  });
}
