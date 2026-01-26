import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import Breadcrumbs from '../../components/Breadcrumbs';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import PostMetaBar from '../../components/PostMetaBar';
import { redirect } from 'next/navigation';
import { formatEventDate, formatEventTime, isEventUpcoming, formatRelativeEventDate } from '../../lib/dates';
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
              COALESCE((SELECT MAX(timeline_comments.created_at) FROM timeline_comments WHERE timeline_comments.update_id = timeline_updates.id AND timeline_comments.is_deleted = 0), timeline_updates.created_at) AS last_activity_at
       FROM timeline_updates
       JOIN users ON users.id = timeline_updates.author_user_id
       WHERE timeline_updates.moved_to_id IS NULL
       ORDER BY timeline_updates.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.created_at,
              COALESCE(timeline_updates.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM timeline_comments WHERE timeline_comments.update_id = timeline_updates.id AND (timeline_comments.is_deleted = 0 OR timeline_comments.is_deleted IS NULL)) AS reply_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'timeline_update' AND post_id = timeline_updates.id), 0) AS like_count,
              COALESCE((SELECT MAX(timeline_comments.created_at) FROM timeline_comments WHERE timeline_comments.update_id = timeline_updates.id AND timeline_comments.is_deleted = 0), timeline_updates.created_at) AS last_activity_at
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
              COALESCE((SELECT MAX(forum_replies.created_at) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0), forum_threads.created_at) AS last_activity_at
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       WHERE forum_threads.moved_to_id IS NULL
       ORDER BY forum_threads.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
              COALESCE(forum_threads.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND (forum_replies.is_deleted = 0 OR forum_replies.is_deleted IS NULL)) AS reply_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'forum_thread' AND post_id = forum_threads.id), 0) AS like_count,
              COALESCE((SELECT MAX(forum_replies.created_at) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0), forum_threads.created_at) AS last_activity_at
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       ORDER BY forum_threads.created_at DESC
       LIMIT ${limitPerType}`,
      []
    ),
    safeAll(
      db,
      `SELECT events.id, events.title, events.created_at, events.starts_at,
              COALESCE(events.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM event_comments WHERE event_comments.event_id = events.id AND (event_comments.is_deleted = 0 OR event_comments.is_deleted IS NULL)) AS comment_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'event' AND post_id = events.id), 0) AS like_count,
              COALESCE((SELECT MAX(event_comments.created_at) FROM event_comments WHERE event_comments.event_id = events.id AND event_comments.is_deleted = 0), events.created_at) AS last_activity_at,
              (SELECT COUNT(*) FROM event_attendees WHERE event_id = events.id) AS attendee_count,
              (SELECT GROUP_CONCAT(users.username) FROM event_attendees JOIN users ON users.id = event_attendees.user_id WHERE event_attendees.event_id = events.id) AS attendee_names
       FROM events
       JOIN users ON users.id = events.author_user_id
       WHERE events.moved_to_id IS NULL
       ORDER BY events.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT events.id, events.title, events.created_at, events.starts_at,
              COALESCE(events.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM event_comments WHERE event_comments.event_id = events.id AND (event_comments.is_deleted = 0 OR event_comments.is_deleted IS NULL)) AS comment_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'event' AND post_id = events.id), 0) AS like_count,
              COALESCE((SELECT MAX(event_comments.created_at) FROM event_comments WHERE event_comments.event_id = events.id AND event_comments.is_deleted = 0), events.created_at) AS last_activity_at,
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
              COALESCE((SELECT MAX(music_comments.created_at) FROM music_comments WHERE music_comments.post_id = music_posts.id AND music_comments.is_deleted = 0), music_posts.created_at) AS last_activity_at
       FROM music_posts
       JOIN users ON users.id = music_posts.author_user_id
       WHERE music_posts.moved_to_id IS NULL
       ORDER BY music_posts.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT music_posts.id, music_posts.title, music_posts.created_at,
              COALESCE(music_posts.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM music_comments WHERE music_comments.post_id = music_posts.id AND (music_comments.is_deleted = 0 OR music_comments.is_deleted IS NULL)) AS comment_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'music_post' AND post_id = music_posts.id), 0) AS like_count,
              COALESCE((SELECT MAX(music_comments.created_at) FROM music_comments WHERE music_comments.post_id = music_posts.id AND music_comments.is_deleted = 0), music_posts.created_at) AS last_activity_at
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
              COALESCE((SELECT MAX(project_replies.created_at) FROM project_replies WHERE project_replies.project_id = projects.id AND project_replies.is_deleted = 0), projects.created_at) AS last_activity_at
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       WHERE projects.moved_to_id IS NULL
       ORDER BY projects.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT projects.id, projects.title, projects.created_at,
              COALESCE(projects.views, 0) AS views,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM project_replies WHERE project_replies.project_id = projects.id AND (project_replies.is_deleted = 0 OR project_replies.is_deleted IS NULL)) AS reply_count,
              COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'project' AND post_id = projects.id), 0) AS like_count,
              COALESCE((SELECT MAX(project_replies.created_at) FROM project_replies WHERE project_replies.project_id = projects.id AND project_replies.is_deleted = 0), projects.created_at) AS last_activity_at
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
                  COALESCE((SELECT MAX(post_comments.created_at) FROM post_comments WHERE post_comments.post_id = posts.id AND post_comments.is_deleted = 0), posts.created_at) AS last_activity_at
           FROM posts
           JOIN users ON users.id = posts.author_user_id
           WHERE posts.type IN ('art','bugs','rant','nostalgia','lore','memories')
             AND (${isSignedIn ? '1=1' : "posts.is_private = 0 AND posts.type NOT IN ('lore','memories')"})
           ORDER BY posts.created_at DESC
           LIMIT ${limitPerType}`,
          [],
          `SELECT posts.id, posts.type, posts.title, posts.created_at, posts.is_private,
                  COALESCE(posts.views, 0) AS views,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id AND (post_comments.is_deleted = 0 OR post_comments.is_deleted IS NULL)) AS comment_count,
                  COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_type = 'post' AND post_id = posts.id), 0) AS like_count,
                  COALESCE((SELECT MAX(post_comments.created_at) FROM post_comments WHERE post_comments.post_id = posts.id AND post_comments.is_deleted = 0), posts.created_at) AS last_activity_at
           FROM posts
           JOIN users ON users.id = posts.author_user_id
           WHERE posts.type IN ('art','bugs','rant','nostalgia','lore','memories')
             AND (${isSignedIn ? '1=1' : "posts.is_private = 0 AND posts.type NOT IN ('lore','memories')"})
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
                  COALESCE((SELECT MAX(dev_log_comments.created_at) FROM dev_log_comments WHERE dev_log_comments.log_id = dev_logs.id AND dev_log_comments.is_deleted = 0), dev_logs.created_at) AS last_activity_at
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
                  COALESCE((SELECT MAX(dev_log_comments.created_at) FROM dev_log_comments WHERE dev_log_comments.log_id = dev_logs.id AND dev_log_comments.is_deleted = 0), dev_logs.created_at) AS last_activity_at
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
      default:
        return type;
    }
  };

  const items = [
    ...announcements.map((row) => ({
      type: 'Announcement',
      href: `/announcements/${row.id}`,
      createdAt: row.created_at,
      title: row.title || 'Update',
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.reply_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at
    })),
    ...threads.map((row) => ({
      type: 'Lobby',
      href: `/lobby/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.reply_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at
    })),
    ...events.map((row) => ({
      type: 'Event',
      href: `/events/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.comment_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at,
      startsAt: row.starts_at,
      attendeeCount: row.attendee_count || 0,
      attendeeNames: row.attendee_names ? String(row.attendee_names).split(',') : []
    })),
    ...music.map((row) => ({
      type: 'Music',
      href: `/music/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.comment_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at
    })),
    ...projects.map((row) => ({
      type: 'Project',
      href: `/projects/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.reply_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at
    })),
    ...posts.map((row) => ({
      type: labelForPostType(row.type),
      href: `/${row.type}/${row.id}`,
      createdAt: row.created_at,
      title: row.title || 'Untitled',
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.comment_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at,
      meta: row.is_private ? 'Members-only' : null
    })),
    ...devlogs.map((row) => ({
      type: 'Development',
      href: `/devlog/${row.id}`,
      createdAt: row.created_at,
      title: row.title || 'Development update',
      author: row.author_name,
      authorColorPreference: row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null,
      views: row.views || 0,
      replies: row.comment_count || 0,
      likes: row.like_count || 0,
      lastActivity: row.last_activity_at || row.created_at
    }))
  ]
    .filter((x) => !!x.createdAt)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 15);

  // Build preferences map and assign unique colors
  const allUsernames = items.flatMap(i => {
    const names = [i.author];
    if (i.attendeeNames) names.push(...i.attendeeNames);
    return names;
  }).filter(Boolean);
  
  const preferredColors = new Map();
  items.forEach(item => {
    if (item.author && item.authorColorPreference !== null && item.authorColorPreference !== undefined) {
      preferredColors.set(item.author, Number(item.authorColorPreference));
    }
  });
  const usernameColorMap = assignUniqueColorsForPage([...new Set(allUsernames)], preferredColors);

  return (
    <div className="stack">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/feed', label: 'Feed' }]} />

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Feed</h2>
          <p className="muted" style={{ margin: 0, textAlign: 'right', flex: '1 1 auto', minWidth: '200px' }}>Recent activity across the portal.</p>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        <div className="list">
          {items.length === 0 ? (
            <p className="muted">Nothing new… the goo is resting.</p>
          ) : (
            items.map((item) => {
              const authorPreferredColor = item.authorColorPreference;
              const authorColorIndex = usernameColorMap.get(item.author) ?? getUsernameColorIndex(item.author, { preferredColorIndex: authorPreferredColor });
              const titleWithType = item.type !== 'Lobby' ? (
                <>
                  {item.title}
                  <span className="muted" style={{ fontSize: '12px', marginLeft: '8px', fontWeight: 'normal' }}>
                    ({item.type})
                  </span>
                </>
              ) : item.title;
              
              return (
                <a
                  key={`${item.type}:${item.href}`}
                  href={item.href}
                  className="list-item"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
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
                    lastActivity={item.lastActivity}
                    titleHref={item.href}
                    showTitleLink={false}
                  />
                  {item.type === 'Event' ? (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
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
                      <span style={{ color: 'var(--muted)' }}>
                        Starts {formatEventDate(item.startsAt)} {formatEventTime(item.startsAt)}
                        {isEventUpcoming(item.startsAt) ? (
                          <span className="muted" style={{ marginLeft: '4px' }}>
                            ({formatRelativeEventDate(item.startsAt)})
                          </span>
                        ) : null}
                      </span>
                      {item.attendeeCount > 0 && (
                        <span style={{ marginLeft: '8px', color: 'var(--muted)' }}>
                          • {item.attendeeCount} attending: {item.attendeeNames.map((name, i) => (
                            <span key={name}>
                              {i > 0 ? ', ' : ''}
                              <Username 
                                name={name}
                                colorIndex={usernameColorMap.get(name) ?? getUsernameColorIndex(name)}
                              />
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
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
