import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { isAdminUser } from '../../lib/admin';
import { getRecentAdminActions } from '../../lib/audit';
import { isImageUploadsEnabled } from '../../lib/settings';
import AdminConsole from '../../components/AdminConsole';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function safeCount(db, sql, binds = []) {
  try {
    const row = await db.prepare(sql).bind(...binds).first();
    return Number(row?.count || 0);
  } catch (e) {
    return 0;
  }
}

async function safeAll(db, sql, binds = []) {
  try {
    const rows = await db.prepare(sql).bind(...binds).all();
    return rows?.results || [];
  } catch (e) {
    return [];
  }
}

async function sumCounts(db, queries) {
  const results = await Promise.all(
    queries.map((query) => safeCount(db, query.sql, query.binds || []))
  );
  return results.reduce((total, value) => total + value, 0);
}

async function gatherStats(db) {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const totalUsers = await safeCount(db, 'SELECT COUNT(*) as count FROM users', []);
  const active24h = await safeCount(db, 'SELECT COUNT(*) as count FROM users WHERE last_seen >= ?', [dayAgo]);
  const active7d = await safeCount(db, 'SELECT COUNT(*) as count FROM users WHERE last_seen >= ?', [weekAgo]);

  const postTables = [
    'forum_threads',
    'posts',
    'timeline_updates',
    'events',
    'music_posts',
    'projects',
    'dev_logs'
  ];

  const commentTables = [
    'forum_replies',
    'post_comments',
    'timeline_comments',
    'event_comments',
    'music_comments',
    'project_comments',
    'project_replies',
    'dev_log_comments'
  ];

  const posts24h = await sumCounts(
    db,
    postTables.map((table) => ({
      sql: `SELECT COUNT(*) as count FROM ${table} WHERE created_at >= ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      binds: [dayAgo]
    }))
  );
  const posts7d = await sumCounts(
    db,
    postTables.map((table) => ({
      sql: `SELECT COUNT(*) as count FROM ${table} WHERE created_at >= ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      binds: [weekAgo]
    }))
  );

  const comments24h = await sumCounts(
    db,
    commentTables.map((table) => ({
      sql: `SELECT COUNT(*) as count FROM ${table} WHERE created_at >= ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      binds: [dayAgo]
    }))
  );
  const comments7d = await sumCounts(
    db,
    commentTables.map((table) => ({
      sql: `SELECT COUNT(*) as count FROM ${table} WHERE created_at >= ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      binds: [weekAgo]
    }))
  );

  const hiddenPosts = await sumCounts(
    db,
    postTables.map((table) => ({
      sql: `SELECT COUNT(*) as count FROM ${table} WHERE is_hidden = 1`,
      binds: []
    }))
  );

  const lockedTables = ['forum_threads', 'posts', 'timeline_updates', 'dev_logs'];
  const lockedPosts = await sumCounts(
    db,
    lockedTables.map((table) => ({
      sql: `SELECT COUNT(*) as count FROM ${table} WHERE is_locked = 1`,
      binds: []
    }))
  );

  const pinnedPosts = await sumCounts(
    db,
    postTables.map((table) => ({
      sql: `SELECT COUNT(*) as count FROM ${table} WHERE is_pinned = 1`,
      binds: []
    }))
  );

  const flaggedItems = await safeCount(db, "SELECT COUNT(*) as count FROM reports WHERE status = 'open'");
  const imageUploadsEnabled = await isImageUploadsEnabled(db);

  return {
    totalUsers,
    active24h,
    active7d,
    posts24h,
    posts7d,
    comments24h,
    comments7d,
    hiddenPosts,
    lockedPosts,
    pinnedPosts,
    flaggedItems,
    imageUploadsEnabled
  };
}

function viewPathForPostType(type) {
  if (type === 'bugs') return '/bugs';
  if (type === 'rant') return '/rant';
  if (type === 'art') return '/art';
  if (type === 'nostalgia') return '/nostalgia';
  if (type === 'lore') return '/lore';
  if (type === 'memories') return '/memories';
  if (type === 'about') return '/about';
  return '/posts';
}

function labelForPostType(type) {
  if (!type) return 'Post';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function labelForContentType(type, row) {
  if (type === 'forum_thread') {
    return row?.is_shitpost ? 'Shitposts' : 'Forum';
  }
  if (type === 'timeline_update') return 'Announcements';
  if (type === 'post') return labelForPostType(row?.type);
  if (type === 'event') return 'Events';
  if (type === 'music_post') return 'Music';
  if (type === 'project') return 'Projects';
  if (type === 'dev_log') return 'Development';
  return 'Post';
}

function viewPathForContent(type, row) {
  if (type === 'forum_thread') return `/lobby/${row.id}`;
  if (type === 'timeline_update') return `/announcements/${row.id}`;
  if (type === 'post') return `${viewPathForPostType(row.type)}/${row.id}`;
  if (type === 'event') return `/events/${row.id}`;
  if (type === 'music_post') return `/music/${row.id}`;
  if (type === 'project') return `/projects/${row.id}`;
  if (type === 'dev_log') return `/devlog/${row.id}`;
  return `/lobby/${row.id}`;
}

function editPathForContent(type, row) {
  if (type === 'forum_thread') return `/api/forum/${row.id}/edit`;
  if (type === 'timeline_update') return `/api/timeline/${row.id}`;
  if (type === 'post') return `/api/posts/${row.id}`;
  if (type === 'event') return `/api/events/${row.id}`;
  if (type === 'project') return `/api/projects/${row.id}`;
  if (type === 'dev_log') return `/api/devlog/${row.id}`;
  return null;
}

function hidePathForContent(type, row) {
  if (type === 'forum_thread') return `/api/forum/${row.id}/hide`;
  if (type === 'timeline_update') return `/api/timeline/${row.id}/hide`;
  if (type === 'post') return `/api/posts/${row.id}/hide`;
  if (type === 'event') return `/api/events/${row.id}/hide`;
  if (type === 'music_post') return `/api/music/${row.id}/hide`;
  if (type === 'project') return `/api/projects/${row.id}/hide`;
  if (type === 'dev_log') return `/api/devlog/${row.id}/hide`;
  return null;
}

function lockPathForContent(type, row) {
  if (type === 'forum_thread') return `/api/forum/${row.id}/lock`;
  if (type === 'timeline_update') return `/api/timeline/${row.id}/lock`;
  if (type === 'post') return `/api/posts/${row.id}/lock`;
  if (type === 'event') return `/api/events/${row.id}/lock`;
  if (type === 'music_post') return `/api/music/${row.id}/lock`;
  if (type === 'project') return `/api/projects/${row.id}/lock`;
  if (type === 'dev_log') return `/api/devlog/${row.id}/lock`;
  return null;
}

async function loadRecentContent(db, limit = 30) {
  const perSource = Math.max(6, Math.ceil(limit / 7));
  const forumColumns = await safeAll(db, "PRAGMA table_info('forum_threads')", []);
  const hasShitpostColumn = forumColumns.some((column) => column.name === 'is_shitpost');
  const forumShitpostSelect = hasShitpostColumn ? 'forum_threads.is_shitpost' : '0 as is_shitpost';
  const sources = [
    {
      type: 'forum_thread',
      sql: `SELECT forum_threads.id, forum_threads.title, forum_threads.body, forum_threads.created_at,
                   forum_threads.is_pinned, forum_threads.is_hidden, forum_threads.is_locked,
                   ${forumShitpostSelect},
                   users.username AS author_name
            FROM forum_threads
            JOIN users ON users.id = forum_threads.author_user_id
            WHERE (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
              AND (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '')
            ORDER BY forum_threads.created_at DESC
            LIMIT ?`
    },
    {
      type: 'timeline_update',
      sql: `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body, timeline_updates.created_at,
                   timeline_updates.is_pinned, timeline_updates.is_hidden, timeline_updates.is_locked,
                   users.username AS author_name
            FROM timeline_updates
            JOIN users ON users.id = timeline_updates.author_user_id
            WHERE (timeline_updates.is_deleted = 0 OR timeline_updates.is_deleted IS NULL)
            ORDER BY timeline_updates.created_at DESC
            LIMIT ?`
    },
    {
      type: 'post',
      sql: `SELECT posts.id, posts.title, posts.body, posts.created_at,
                   posts.type, posts.is_private, posts.is_pinned, posts.is_hidden, posts.is_locked,
                   users.username AS author_name
            FROM posts
            JOIN users ON users.id = posts.author_user_id
            WHERE (posts.is_deleted = 0 OR posts.is_deleted IS NULL)
            ORDER BY posts.created_at DESC
            LIMIT ?`
    },
    {
      type: 'event',
      sql: `SELECT events.id, events.title, events.details AS body, events.created_at,
                   events.is_pinned, events.is_hidden, events.is_deleted,
                   0 AS is_locked,
                   events.starts_at,
                   users.username AS author_name
            FROM events
            JOIN users ON users.id = events.author_user_id
            WHERE (events.is_deleted = 0 OR events.is_deleted IS NULL)
            ORDER BY events.created_at DESC
            LIMIT ?`
    },
    {
      type: 'music_post',
      sql: `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.created_at,
                   music_posts.url, music_posts.is_pinned, music_posts.is_hidden, music_posts.is_deleted,
                   0 AS is_locked,
                   users.username AS author_name
            FROM music_posts
            JOIN users ON users.id = music_posts.author_user_id
            WHERE (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)
            ORDER BY music_posts.created_at DESC
            LIMIT ?`
    },
    {
      type: 'project',
      sql: `SELECT projects.id, projects.title, projects.description AS body, projects.created_at,
                   projects.status, projects.updates_enabled, projects.is_pinned, projects.is_hidden, projects.is_deleted,
                   0 AS is_locked,
                   users.username AS author_name
            FROM projects
            JOIN users ON users.id = projects.author_user_id
            WHERE (projects.is_deleted = 0 OR projects.is_deleted IS NULL)
            ORDER BY projects.created_at DESC
            LIMIT ?`
    },
    {
      type: 'dev_log',
      sql: `SELECT dev_logs.id, dev_logs.title, dev_logs.body, dev_logs.created_at,
                   dev_logs.is_pinned, dev_logs.is_hidden, dev_logs.is_locked,
                   users.username AS author_name
            FROM dev_logs
            JOIN users ON users.id = dev_logs.author_user_id
            WHERE (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL)
            ORDER BY dev_logs.created_at DESC
            LIMIT ?`
    }
  ];

  const results = await Promise.all(
    sources.map((source) => safeAll(db, source.sql, [perSource]))
  );

  const combined = [];
  results.forEach((rows, index) => {
    const source = sources[index];
    rows.forEach((row) => {
      combined.push({
        id: row.id,
        title: row.title,
        body: row.body,
        createdAt: row.created_at,
        authorName: row.author_name,
        type: source.type,
        subtype: row.type || null,
        isPinned: Boolean(row.is_pinned),
        isHidden: Boolean(row.is_hidden),
        isLocked: Boolean(row.is_locked),
        isPrivate: Boolean(row.is_private),
        updatesEnabled: row.updates_enabled ? Boolean(row.updates_enabled) : false,
        sectionLabel: labelForContentType(source.type, row),
        viewHref: viewPathForContent(source.type, row),
        editHref: editPathForContent(source.type, row),
        hideHref: hidePathForContent(source.type, row),
        lockHref: lockPathForContent(source.type, row),
        startsAt: row.starts_at || null,
        status: row.status || null
      });
    });
  });

  combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return combined.slice(0, limit);
}

async function loadRecentUsers(db, limit = 16) {
  const rows = await safeAll(
    db,
    `SELECT id, username, role, created_at, last_seen
     FROM users
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.created_at,
    lastSeen: row.last_seen
  }));
}

async function loadOpenReports(db, limit = 20) {
  const rows = await safeAll(
    db,
    `SELECT reports.id, reports.target_type, reports.target_id, reports.reason, reports.created_at, reports.status,
            users.username AS reporter
     FROM reports
     JOIN users ON users.id = reports.user_id
     WHERE reports.status = 'open'
     ORDER BY reports.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map((row) => ({
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason || '',
    createdAt: row.created_at,
    status: row.status,
    reporter: row.reporter
  }));
}

async function loadMediaStats(db) {
  const tables = [
    { label: 'Forum', table: 'forum_threads' },
    { label: 'Posts', table: 'posts' },
    { label: 'Announcements', table: 'timeline_updates' },
    { label: 'Events', table: 'events' },
    { label: 'Music', table: 'music_posts' },
    { label: 'Projects', table: 'projects' },
    { label: 'Dev logs', table: 'dev_logs' }
  ];
  const counts = await Promise.all(
    tables.map((entry) =>
      safeCount(db, `SELECT COUNT(*) as count FROM ${entry.table} WHERE image_key IS NOT NULL`, [])
    )
  );
  const galleryCount = await safeCount(db, 'SELECT COUNT(*) as count FROM user_gallery_images', []);
  return {
    totals: tables.map((entry, index) => ({
      label: entry.label,
      count: counts[index] || 0
    })),
    galleryCount
  };
}

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    redirect('/');
  }

  const db = await getDb();
  const [stats, posts, actions, users, reports, media] = await Promise.all([
    gatherStats(db),
    loadRecentContent(db),
    getRecentAdminActions(db, 8),
    loadRecentUsers(db),
    loadOpenReports(db),
    loadMediaStats(db)
  ]);

  return (
    <div className="admin-page stack">
      <AdminConsole stats={stats} posts={posts} actions={actions} users={users} reports={reports} media={media} user={user} />
    </div>
  );
}
