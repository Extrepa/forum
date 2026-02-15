import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { isDripNomad } from '../../lib/admin';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import PostMetaBar from '../../components/PostMetaBar';
import { redirect } from 'next/navigation';
import { formatEventDate, formatEventTime, isEventUpcoming, formatRelativeEventDate, formatDateTime, getEventDayCompletionTimestamp } from '../../lib/dates';
import Username from '../../components/Username';

export const dynamic = 'force-dynamic';

async function safeAll(db, primarySql, primaryBinds, fallbackSql, fallbackBinds) {
  try {
    const stmt = db.prepare(primarySql);
    const bound = primaryBinds?.length ? stmt.bind(...primaryBinds) : stmt;
    const out = await bound.all();
    return out?.results || [];
  } catch (e) {
    const stmt = db.prepare(fallbackSql);
    const bound = fallbackBinds?.length ? stmt.bind(...fallbackBinds) : stmt;
    const out = await bound.all();
    return out?.results || [];
  }
}

export default async function FeedPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  
  const db = await getDb();
  const isSignedIn = true; // Always true after redirect check
  const canViewNomads = isDripNomad(user);
  const limitPerType = 20;

  const [announcements, threads, events, music, projects, posts, devlogs] = await Promise.all([
    safeAll(
      db,
      `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.created_at,
              COALESCE(timeline_updates.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM timeline_comments WHERE timeline_comments.update_id = timeline_updates.id AND (timeline_comments.is_deleted = 0 OR timeline_comments.is_deleted IS NULL)) AS reply_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'timeline_update' AND post_id = timeline_updates.id), 0) AS like_count,
              COALESCE((SELECT MAX(timeline_comments.created_at) FROM timeline_comments WHERE timeline_comments.update_id = timeline_updates.id AND timeline_comments.is_deleted = 0), timeline_updates.created_at) AS last_activity_at,
              COALESCE((SELECT users.username FROM timeline_comments JOIN users ON users.id = timeline_comments.author_user_id WHERE timeline_comments.update_id = timeline_updates.id AND timeline_comments.is_deleted = 0 ORDER BY timeline_comments.created_at DESC LIMIT 1), users.username) AS last_activity_author
       FROM timeline_updates
       JOIN users ON users.id = timeline_updates.author_user_id
       WHERE timeline_updates.moved_to_id IS NULL
         AND (timeline_updates.is_hidden = 0 OR timeline_updates.is_hidden IS NULL)
         AND (timeline_updates.is_deleted = 0 OR timeline_updates.is_deleted IS NULL)
       ORDER BY timeline_updates.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.created_at,
              COALESCE(timeline_updates.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM timeline_comments WHERE timeline_comments.update_id = timeline_updates.id AND (timeline_comments.is_deleted = 0 OR timeline_comments.is_deleted IS NULL)) AS reply_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'timeline_update' AND post_id = timeline_updates.id), 0) AS like_count,
              COALESCE((SELECT MAX(timeline_comments.created_at) FROM timeline_comments WHERE timeline_comments.update_id = timeline_updates.id AND timeline_comments.is_deleted = 0), timeline_updates.created_at) AS last_activity_at,
              COALESCE((SELECT users.username FROM timeline_comments JOIN users ON users.id = timeline_comments.author_user_id WHERE timeline_comments.update_id = timeline_updates.id AND timeline_comments.is_deleted = 0 ORDER BY timeline_comments.created_at DESC LIMIT 1), users.username) AS last_activity_author
       FROM timeline_updates
       JOIN users ON users.id = timeline_updates.author_user_id
       ORDER BY timeline_updates.created_at DESC
       LIMIT ${limitPerType}`,
      []
    ),
    safeAll(
      db,
      `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
              COALESCE(forum_threads.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND (forum_replies.is_deleted = 0 OR forum_replies.is_deleted IS NULL)) AS reply_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'forum_thread' AND post_id = forum_threads.id), 0) AS like_count,
              COALESCE((SELECT MAX(forum_replies.created_at) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0), forum_threads.created_at) AS last_activity_at,
              COALESCE((SELECT users.username FROM forum_replies JOIN users ON users.id = forum_replies.author_user_id WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0 ORDER BY forum_replies.created_at DESC LIMIT 1), users.username) AS last_activity_author
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       WHERE forum_threads.moved_to_id IS NULL
         AND (forum_threads.is_hidden = 0 OR forum_threads.is_hidden IS NULL)
         AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
       ORDER BY forum_threads.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
              COALESCE(forum_threads.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND (forum_replies.is_deleted = 0 OR forum_replies.is_deleted IS NULL)) AS reply_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'forum_thread' AND post_id = forum_threads.id), 0) AS like_count,
              COALESCE((SELECT MAX(forum_replies.created_at) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0), forum_threads.created_at) AS last_activity_at,
              COALESCE((SELECT users.username FROM forum_replies JOIN users ON users.id = forum_replies.author_user_id WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0 ORDER BY forum_replies.created_at DESC LIMIT 1), users.username) AS last_activity_author
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       ORDER BY forum_threads.created_at DESC
       LIMIT ${limitPerType}`,
      []
    ),
    safeAll(
      db,
      `SELECT events.id, events.title, events.created_at, events.starts_at, events.ends_at,
              COALESCE(events.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM event_comments WHERE event_comments.event_id = events.id AND (event_comments.is_deleted = 0 OR event_comments.is_deleted IS NULL)) AS comment_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'event' AND post_id = events.id), 0) AS like_count,
              COALESCE((SELECT MAX(event_comments.created_at) FROM event_comments WHERE event_comments.event_id = events.id AND event_comments.is_deleted = 0), events.created_at) AS last_activity_at,
              COALESCE((SELECT users.username FROM event_comments JOIN users ON users.id = event_comments.author_user_id WHERE event_comments.event_id = events.id AND event_comments.is_deleted = 0 ORDER BY event_comments.created_at DESC LIMIT 1), users.username) AS last_activity_author,
              (SELECT COUNT(*) FROM event_attendees WHERE event_id = events.id) AS attendee_count,
              (SELECT GROUP_CONCAT(users.username) FROM event_attendees JOIN users ON users.id = event_attendees.user_id WHERE event_attendees.event_id = events.id) AS attendee_names
       FROM events
       JOIN users ON users.id = events.author_user_id
       WHERE events.moved_to_id IS NULL
         AND (events.is_hidden = 0 OR events.is_hidden IS NULL)
         AND (events.is_deleted = 0 OR events.is_deleted IS NULL)
         AND (${canViewNomads ? "1=1" : "(events.visibility_scope IS NULL OR events.visibility_scope = 'members')"})
       ORDER BY events.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT events.id, events.title, events.created_at, events.starts_at, events.ends_at,
              COALESCE(events.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM event_comments WHERE event_comments.event_id = events.id AND (event_comments.is_deleted = 0 OR event_comments.is_deleted IS NULL)) AS comment_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'event' AND post_id = events.id), 0) AS like_count,
              COALESCE((SELECT MAX(event_comments.created_at) FROM event_comments WHERE event_comments.event_id = events.id AND event_comments.is_deleted = 0), events.created_at) AS last_activity_at,
              COALESCE((SELECT users.username FROM event_comments JOIN users ON users.id = event_comments.author_user_id WHERE event_comments.event_id = events.id AND event_comments.is_deleted = 0 ORDER BY event_comments.created_at DESC LIMIT 1), users.username) AS last_activity_author,
              (SELECT COUNT(*) FROM event_attendees WHERE event_id = events.id) AS attendee_count,
              (SELECT GROUP_CONCAT(users.username) FROM event_attendees JOIN users ON users.id = event_attendees.user_id WHERE event_attendees.event_id = events.id) AS attendee_names
       FROM events
       JOIN users ON users.id = events.author_user_id
       ORDER BY events.created_at DESC
       LIMIT ${limitPerType}`,
      []
    ),
    safeAll(
      db,
      `SELECT music_posts.id, music_posts.title, music_posts.created_at,
              COALESCE(music_posts.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM music_comments WHERE music_comments.post_id = music_posts.id AND (music_comments.is_deleted = 0 OR music_comments.is_deleted IS NULL)) AS comment_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'music_post' AND post_id = music_posts.id), 0) AS like_count,
              COALESCE((SELECT MAX(music_comments.created_at) FROM music_comments WHERE music_comments.post_id = music_posts.id AND music_comments.is_deleted = 0), music_posts.created_at) AS last_activity_at,
              COALESCE((SELECT users.username FROM music_comments JOIN users ON users.id = music_comments.author_user_id WHERE music_comments.post_id = music_posts.id AND music_comments.is_deleted = 0 ORDER BY music_comments.created_at DESC LIMIT 1), users.username) AS last_activity_author
       FROM music_posts
       JOIN users ON users.id = music_posts.author_user_id
       WHERE music_posts.moved_to_id IS NULL
         AND (music_posts.is_hidden = 0 OR music_posts.is_hidden IS NULL)
         AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)
       ORDER BY music_posts.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT music_posts.id, music_posts.title, music_posts.created_at,
              COALESCE(music_posts.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM music_comments WHERE music_comments.post_id = music_posts.id AND (music_comments.is_deleted = 0 OR music_comments.is_deleted IS NULL)) AS comment_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'music_post' AND post_id = music_posts.id), 0) AS like_count,
              COALESCE((SELECT MAX(music_comments.created_at) FROM music_comments WHERE music_comments.post_id = music_posts.id AND music_comments.is_deleted = 0), music_posts.created_at) AS last_activity_at,
              COALESCE((SELECT users.username FROM music_comments JOIN users ON users.id = music_comments.author_user_id WHERE music_comments.post_id = music_posts.id AND music_comments.is_deleted = 0 ORDER BY music_comments.created_at DESC LIMIT 1), users.username) AS last_activity_author
       FROM music_posts
       JOIN users ON users.id = music_posts.author_user_id
       ORDER BY music_posts.created_at DESC
       LIMIT ${limitPerType}`,
      []
    ),
    safeAll(
      db,
      `SELECT projects.id, projects.title, projects.created_at,
              COALESCE(projects.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM project_replies WHERE project_replies.project_id = projects.id AND (project_replies.is_deleted = 0 OR project_replies.is_deleted IS NULL)) AS reply_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'project' AND post_id = projects.id), 0) AS like_count,
              COALESCE((SELECT MAX(project_replies.created_at) FROM project_replies WHERE project_replies.project_id = projects.id AND project_replies.is_deleted = 0), projects.created_at) AS last_activity_at,
              COALESCE((SELECT users.username FROM project_replies JOIN users ON users.id = project_replies.author_user_id WHERE project_replies.project_id = projects.id AND project_replies.is_deleted = 0 ORDER BY project_replies.created_at DESC LIMIT 1), users.username) AS last_activity_author
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       WHERE projects.moved_to_id IS NULL
         AND (projects.is_hidden = 0 OR projects.is_hidden IS NULL)
         AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)
       ORDER BY projects.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT projects.id, projects.title, projects.created_at,
              COALESCE(projects.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM project_replies WHERE project_replies.project_id = projects.id AND (project_replies.is_deleted = 0 OR project_replies.is_deleted IS NULL)) AS reply_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'project' AND post_id = projects.id), 0) AS like_count,
              COALESCE((SELECT MAX(project_replies.created_at) FROM project_replies WHERE project_replies.project_id = projects.id AND project_replies.is_deleted = 0), projects.created_at) AS last_activity_at,
              COALESCE((SELECT users.username FROM project_replies JOIN users ON users.id = project_replies.author_user_id WHERE project_replies.project_id = projects.id AND project_replies.is_deleted = 0 ORDER BY project_replies.created_at DESC LIMIT 1), users.username) AS last_activity_author
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       ORDER BY projects.created_at DESC
       LIMIT ${limitPerType}`,
      []
    ),
    (async () => {
      try {
        return await safeAll(
          db,
          `SELECT posts.id, posts.type, posts.title, posts.created_at, posts.is_private,
                  COALESCE(posts.views, 0) AS views,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id AND (post_comments.is_deleted = 0 OR post_comments.is_deleted IS NULL)) AS comment_count,
                  COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'post' AND post_id = posts.id), 0) AS like_count,
                  COALESCE((SELECT MAX(post_comments.created_at) FROM post_comments WHERE post_comments.post_id = posts.id AND post_comments.is_deleted = 0), posts.created_at) AS last_activity_at,
                  COALESCE((SELECT users.username FROM post_comments JOIN users ON users.id = post_comments.author_user_id WHERE post_comments.post_id = posts.id AND post_comments.is_deleted = 0 ORDER BY post_comments.created_at DESC LIMIT 1), users.username) AS last_activity_author
           FROM posts
           JOIN users ON users.id = posts.author_user_id
           WHERE posts.type IN ('art','bugs','rant','nostalgia','lore','memories','nomads')
             AND (posts.is_hidden = 0 OR posts.is_hidden IS NULL)
             AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL)
             AND (${canViewNomads ? "1=1" : "(posts.visibility_scope IS NULL OR posts.visibility_scope = 'members')"})
           ORDER BY posts.created_at DESC
           LIMIT ${limitPerType}`,
          [],
          `SELECT posts.id, posts.type, posts.title, posts.created_at, posts.is_private,
                  COALESCE(posts.views, 0) AS views,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id AND (post_comments.is_deleted = 0 OR post_comments.is_deleted IS NULL)) AS comment_count,
                  COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'post' AND post_id = posts.id), 0) AS like_count,
                  COALESCE((SELECT MAX(post_comments.created_at) FROM post_comments WHERE post_comments.post_id = posts.id AND post_comments.is_deleted = 0), posts.created_at) AS last_activity_at,
                  COALESCE((SELECT users.username FROM post_comments JOIN users ON users.id = post_comments.author_user_id WHERE post_comments.post_id = posts.id AND post_comments.is_deleted = 0 ORDER BY post_comments.created_at DESC LIMIT 1), users.username) AS last_activity_author
           FROM posts
           JOIN users ON users.id = posts.author_user_id
           WHERE posts.type IN ('art','bugs','rant','nostalgia','lore','memories','nomads')
             AND (${canViewNomads ? "1=1" : "(posts.visibility_scope IS NULL OR posts.visibility_scope = 'members')"})
           ORDER BY posts.created_at DESC
           LIMIT ${limitPerType}`,
          []
        );
      } catch (e) {
        // Table doesn't exist yet (migration 0017_shared_posts.sql not run)
        return [];
      }
    })(),
    isSignedIn
      ? safeAll(
          db,
          `SELECT dev_logs.id, dev_logs.title, dev_logs.created_at,
                  COALESCE(dev_logs.views, 0) AS views,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  (SELECT COUNT(*) FROM dev_log_comments WHERE dev_log_comments.log_id = dev_logs.id AND (dev_log_comments.is_deleted = 0 OR dev_log_comments.is_deleted IS NULL)) AS comment_count,
                  COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'dev_log' AND post_id = dev_logs.id), 0) AS like_count,
                  COALESCE((SELECT MAX(dev_log_comments.created_at) FROM dev_log_comments WHERE dev_log_comments.log_id = dev_logs.id AND dev_log_comments.is_deleted = 0), dev_logs.created_at) AS last_activity_at,
                  COALESCE((SELECT users.username FROM dev_log_comments JOIN users ON users.id = dev_log_comments.author_user_id WHERE dev_log_comments.log_id = dev_logs.id AND dev_log_comments.is_deleted = 0 ORDER BY dev_log_comments.created_at DESC LIMIT 1), users.username) AS last_activity_author
           FROM dev_logs
           JOIN users ON users.id = dev_logs.author_user_id
           ORDER BY dev_logs.created_at DESC
           LIMIT ${limitPerType}`,
          [],
          `SELECT dev_logs.id, dev_logs.title, dev_logs.created_at,
                  COALESCE(dev_logs.views, 0) AS views,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  (SELECT COUNT(*) FROM dev_log_comments WHERE dev_log_comments.log_id = dev_logs.id AND (dev_log_comments.is_deleted = 0 OR dev_log_comments.is_deleted IS NULL)) AS comment_count,
                  COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'dev_log' AND post_id = dev_logs.id), 0) AS like_count,
                  COALESCE((SELECT MAX(dev_log_comments.created_at) FROM dev_log_comments WHERE dev_log_comments.log_id = dev_logs.id AND dev_log_comments.is_deleted = 0), dev_logs.created_at) AS last_activity_at,
                  COALESCE((SELECT users.username FROM dev_log_comments JOIN users ON users.id = dev_log_comments.author_user_id WHERE dev_log_comments.log_id = dev_logs.id AND dev_log_comments.is_deleted = 0 ORDER BY dev_log_comments.created_at DESC LIMIT 1), users.username) AS last_activity_author
           FROM dev_logs
           JOIN users ON users.id = dev_logs.author_user_id
           ORDER BY dev_logs.created_at DESC
           LIMIT ${limitPerType}`,
          []
        )
      : Promise.resolve([])
  ]);

  const labelForPostType = (type) => {
    switch (type) {
      case 'art':
        return 'Art';
      case 'bugs':
        return 'Bugs';
      case 'rant':
        return 'Rant';
      case 'nostalgia':
        return 'Nostalgia';
      case 'lore':
        return 'Lore';
      case 'memories':
        return 'Memories';
      case 'nomads':
        return 'Nomads';
      default:
        return type;
    }
  };

  const items = [
    ...announcements.map((row) => ({
      type: 'Announcement',
      contentType: 'timeline_update',
      contentId: row.id,
      href: `/announcements/${row.id}`,
      createdAt: row.created_at,
      title: row.title || 'Update',
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.reply_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at,
      lastActivityBy: row.last_activity_author || null
    })),
    ...threads.map((row) => ({
      type: 'Lobby',
      contentType: 'forum_thread',
      contentId: row.id,
      href: `/lobby/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.reply_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at,
      lastActivityBy: row.last_activity_author || row.author_name || null
    })),
    ...events.map((row) => ({
      type: 'Event',
      contentType: 'event',
      contentId: row.id,
      href: `/events/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.comment_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at,
      lastActivityBy: row.last_activity_author || row.author_name || null,
      startsAt: row.starts_at,
      endsAt: row.ends_at || null,
      attendeeCount: row.attendee_count || 0,
      attendeeNames: row.attendee_names ? String(row.attendee_names).split(',') : []
    })),
    ...music.map((row) => ({
      type: 'Music',
      contentType: 'music_post',
      contentId: row.id,
      href: `/music/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.comment_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at,
      lastActivityBy: row.last_activity_author || row.author_name || null
    })),
    ...projects.map((row) => ({
      type: 'Project',
      contentType: 'project',
      contentId: row.id,
      href: `/projects/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.reply_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at,
      lastActivityBy: row.last_activity_author || row.author_name || null
    })),
    ...posts.map((row) => ({
      type: labelForPostType(row.type),
      contentType: 'post',
      contentId: row.id,
      href: row.type === 'nomads' ? `/nomads/${row.id}` : `/${row.type}/${row.id}`,
      createdAt: row.created_at,
      title: row.title || 'Untitled',
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.comment_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at,
      lastActivityBy: row.last_activity_author || row.author_name || null,
      meta: row.is_private ? 'Members-only' : null
    })),
    ...devlogs.map((row) => ({
      type: 'Development',
      contentType: 'dev_log',
      contentId: row.id,
      href: `/devlog/${row.id}`,
      createdAt: row.created_at,
      title: row.title || 'Development update',
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.comment_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at,
      lastActivityBy: row.last_activity_author || row.author_name || null
    }))
  ]
    .filter((x) => !!x.createdAt)
    .sort((a, b) => (b.lastActivity || b.createdAt) - (a.lastActivity || a.createdAt))
    .slice(0, 15);

  // Add unread status for logged-in users
  if (user && items.length > 0) {
    try {
      // Group items by content type
      const itemsByType = new Map();
      items.forEach(item => {
        if (!itemsByType.has(item.contentType)) {
          itemsByType.set(item.contentType, []);
        }
        itemsByType.get(item.contentType).push(item);
      });

      // Check unread status for each content type
      for (const [contentType, typeItems] of itemsByType.entries()) {
        const contentIds = typeItems.map(i => i.contentId);
        if (contentIds.length === 0) continue;

        if (contentType === 'forum_thread') {
          // Forum threads use specialized forum_thread_reads table
          try {
            const placeholders = contentIds.map(() => '?').join(',');
            const readStates = await db
              .prepare(
                `SELECT thread_id FROM forum_thread_reads 
                 WHERE user_id = ? AND thread_id IN (${placeholders})`
              )
              .bind(user.id, ...contentIds)
              .all();

            const readSet = new Set();
            (readStates?.results || []).forEach(r => {
              readSet.add(r.thread_id);
            });

            typeItems.forEach(item => {
              item.is_unread = !readSet.has(item.contentId);
            });
          } catch (e) {
            // forum_thread_reads table might not exist yet, mark all as read
            typeItems.forEach(item => {
              item.is_unread = false;
            });
          }
        } else {
          // Other content types use content_reads table
          try {
            const placeholders = contentIds.map(() => '?').join(',');
            const readStates = await db
              .prepare(
                `SELECT content_id FROM content_reads 
                 WHERE user_id = ? AND content_type = ? AND content_id IN (${placeholders})`
              )
              .bind(user.id, contentType, ...contentIds)
              .all();

            const readSet = new Set();
            (readStates?.results || []).forEach(r => {
              readSet.add(r.content_id);
            });

            typeItems.forEach(item => {
              item.is_unread = !readSet.has(item.contentId);
            });
          } catch (e) {
            // content_reads table might not exist yet, mark all as read
            typeItems.forEach(item => {
              item.is_unread = false;
            });
          }
        }
      }
    } catch (e) {
      // Error checking read status, mark all as read
      items.forEach(item => {
        item.is_unread = false;
      });
    }
  } else {
    items.forEach(item => {
      item.is_unread = false;
    });
  }

  // Build preferences map and assign unique colors
  const allUsernames = items.flatMap(i => {
    const names = [i.author];
    if (i.attendeeNames) names.push(...i.attendeeNames);
    if (i.lastActivityBy) names.push(i.lastActivityBy);
    return names;
  }).filter(Boolean);
  
  const preferredColors = new Map();
  const uniqueUsernames = [...new Set(allUsernames.filter(Boolean).map(name => String(name).trim()).filter(Boolean))];
  if (uniqueUsernames.length > 0) {
    try {
      const placeholders = uniqueUsernames.map(() => '?').join(',');
      const out = await db
        .prepare(`SELECT username, preferred_username_color_index FROM users WHERE username IN (${placeholders})`)
        .bind(...uniqueUsernames)
        .all();
      for (const row of out?.results || []) {
        if (row?.username && row.preferred_username_color_index !== null && row.preferred_username_color_index !== undefined) {
          preferredColors.set(String(row.username), Number(row.preferred_username_color_index));
        }
      }
    } catch (e) {
      // Fall back to per-item values when lookup is unavailable.
    }
  }
  items.forEach((item) => {
    if (item.author && item.authorColorPreference !== null && item.authorColorPreference !== undefined) {
      preferredColors.set(item.author, Number(item.authorColorPreference));
    }
  });
  const usernameColorMap = assignUniqueColorsForPage(uniqueUsernames, preferredColors);
  const outlineDurations = [5.2, 5.6, 6.0, 6.4, 6.8];

  return (
    <div className="stack">
      <section className="card">
        <div className="feed-header-row section-intro">
          <div className="section-intro__meta">
            <h2 className="section-title section-intro__title">Feed</h2>
            <p className="feed-header-desc section-intro__desc">Recent activity across the portal.</p>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="list list--tight">
          {items.length === 0 ? (
            <p className="muted">Nothing new… the goo is resting.</p>
          ) : (
            items.map((item, index) => {
              const authorPreferredColor = item.authorColorPreference;
              const authorColorIndex = usernameColorMap.get(item.author) ?? getUsernameColorIndex(item.author, { preferredColorIndex: authorPreferredColor });
              const statusIcons = [];
              if (item.is_unread) statusIcons.push('🆕');
              const titleWithType = (
                <>
                  {statusIcons.length > 0 ? <span style={{ marginRight: '6px' }}>{statusIcons.join(' ')}</span> : null}
                  {item.title}
                  <span className="muted" style={{ fontSize: '12px', marginLeft: '4px', marginRight: 0, fontWeight: 'normal' }}>
                    ({item.type})
                  </span>
                </>
              );
              const outlineDuration = (outlineDurations[index % outlineDurations.length] + (index * 0.03)).toFixed(2);
              
              return (
                <a
                  key={`${item.type}:${item.href}`}
                  href={item.href}
                  className={`list-item ${item.is_unread ? 'thread-unread' : ''}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer', '--list-outline-anim-duration': `${outlineDuration}s` }}
                >
                  <PostMetaBar
                    title={titleWithType}
                    author={item.author}
                    authorColorIndex={authorColorIndex}
                    authorPreferredColorIndex={authorPreferredColor}
                    views={item.views}
                    replies={item.replies}
                    likes={item.likes}
                    createdAt={item.createdAt}
                    lastActivity={item.type === 'Event' ? undefined : item.lastActivity}
                    lastActivityBy={item.type === 'Event' ? undefined : item.lastActivityBy}
                    lastActivityByColorIndex={item.lastActivityBy ? (usernameColorMap.get(item.lastActivityBy) ?? getUsernameColorIndex(item.lastActivityBy, { preferredColorIndex: preferredColors.get(item.lastActivityBy) })) : undefined}
                    lastActivityByPreferredColorIndex={item.lastActivityBy ? preferredColors.get(item.lastActivityBy) : undefined}
                    titleHref={item.href}
                    showTitleLink={false}
                    hideDateOnDesktop={item.type === 'Event'}
                    authorDateInline={item.type === 'Event'}
                  />
                  {item.type === 'Event' ? (
                    <>
                      {(() => {
                        const eventEndAt = item.endsAt || item.startsAt;
                        const completionAt = getEventDayCompletionTimestamp(eventEndAt);
                        const hasPassed = completionAt > 0 && Date.now() > completionAt;
                        return (
                          <>
                      {/* Second Row: Post time on left, Event Information on right */}
                      <div className="event-info-row" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        rowGap: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: 'var(--errl-accent-3)', flexShrink: 0 }}
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span className="muted" style={{ color: 'var(--errl-accent-3)', fontSize: '12px' }}>
                            Starts {formatEventDate(item.startsAt)} {formatEventTime(item.startsAt)}
                            {!hasPassed && isEventUpcoming(item.startsAt) ? (
                              <span className="muted" style={{ marginLeft: '4px', color: 'var(--errl-accent-3)' }}>
                                ({formatRelativeEventDate(item.startsAt)})
                              </span>
                            ) : null}
                            {hasPassed ? (
                              <span className="muted" style={{ marginLeft: '4px', color: 'var(--errl-accent-3)' }}>
                                (Event happened)
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </div>
                      {/* Bottom Row: Attending List on left, Last Activity on right */}
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        marginTop: '8px',
                        flexWrap: 'wrap',
                        gap: '8px',
                        rowGap: '4px'
                      }}>
                        {/* Bottom Left: Attending List */}
                        {item.attendeeCount > 0 && (
                          <span style={{ color: 'var(--muted)' }} title={item.attendeeNames.join(', ')}>
                            {item.attendeeCount} {hasPassed ? 'attended' : 'attending'}: {item.attendeeNames.map((name, i) => (
                              <span key={name}>
                                {i > 0 ? ', ' : ''}
                                <Username 
                                  name={name}
                                  colorIndex={usernameColorMap.get(name) ?? getUsernameColorIndex(name, { preferredColorIndex: preferredColors.get(name) })}
                                  preferredColorIndex={preferredColors.get(name)}
                                />
                              </span>
                            ))}
                          </span>
                        )}
                        {/* Bottom Right: Last Activity - hide when no replies (avoids duplicating author) */}
                        {item.lastActivity && item.replies > 0 && (
                          <span className="muted" style={{ whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                            Last activity{item.lastActivityBy ? (
                              <> by <Username name={item.lastActivityBy} colorIndex={usernameColorMap.get(item.lastActivityBy) ?? getUsernameColorIndex(item.lastActivityBy, { preferredColorIndex: preferredColors.get(item.lastActivityBy) })} preferredColorIndex={preferredColors.get(item.lastActivityBy)} /></>
                            ) : null} at <span suppressHydrationWarning>{formatDateTime(item.lastActivity)}</span>
                          </span>
                        )}
                      </div>
                          </>
                        );
                      })()}
                    </>
                  ) : item.meta ? (
                    <span className="muted" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {item.meta}
                    </span>
                  ) : null}
                </a>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
