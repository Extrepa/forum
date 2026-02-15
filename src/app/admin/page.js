import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { isAdminUser } from '../../lib/admin';
import { getRecentAdminActions } from '../../lib/audit';
import { isImageUploadsEnabled } from '../../lib/settings';
import {
  ADMIN_COMMENT_TABLES,
  ADMIN_LOCK_TABLES,
  ADMIN_POST_TABLES,
  MEDIA_TABLES,
  contentTypeDeletePath,
  contentTypeEditPath,
  contentTypeHidePath,
  contentTypeLabel,
  contentTypeLockPath,
  contentTypeViewPath
} from '../../lib/contentTypes';
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
  const userColumns = await safeAll(db, "PRAGMA table_info('users')", []);
  const hasUserDeleted = userColumns.some((column) => column.name === 'is_deleted');
  const userVisibilityClause = hasUserDeleted ? 'WHERE is_deleted = 0 OR is_deleted IS NULL' : '';
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const totalUsers = await safeCount(db, `SELECT COUNT(*) as count FROM users ${userVisibilityClause}`, []);
  const active24h = await safeCount(
    db,
    `SELECT COUNT(*) as count FROM users WHERE last_seen >= ?${hasUserDeleted ? ' AND (is_deleted = 0 OR is_deleted IS NULL)' : ''}`,
    [dayAgo]
  );
  const active7d = await safeCount(
    db,
    `SELECT COUNT(*) as count FROM users WHERE last_seen >= ?${hasUserDeleted ? ' AND (is_deleted = 0 OR is_deleted IS NULL)' : ''}`,
    [weekAgo]
  );

  const postTables = ADMIN_POST_TABLES;
  const commentTables = ADMIN_COMMENT_TABLES;

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

  const lockedTables = ADMIN_LOCK_TABLES;
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

function labelForContentType(type, row) {
  return contentTypeLabel(type, row);
}

function viewPathForReportTarget(targetType, targetId) {
  if (!targetType || !targetId) return null;
  if (targetType === 'forum_thread') return `/lobby/${targetId}`;
  if (targetType === 'timeline_update') return `/announcements/${targetId}`;
  if (targetType === 'post') return `/admin?tab=posts`;
  if (targetType === 'event') return `/events/${targetId}`;
  if (targetType === 'music_post') return `/music/${targetId}`;
  if (targetType === 'project') return `/projects/${targetId}`;
  if (targetType === 'dev_log') return `/devlog/${targetId}`;
  return null;
}

function viewPathForContent(type, row) {
  return contentTypeViewPath(type, row);
}

function editPathForContent(type, row) {
  return contentTypeEditPath(type, row);
}

function hidePathForContent(type, row) {
  return contentTypeHidePath(type, row);
}

function lockPathForContent(type, row) {
  return contentTypeLockPath(type, row);
}

function deletePathForContent(type, row) {
  return contentTypeDeletePath(type, row);
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
                   forum_threads.is_pinned, forum_threads.is_hidden, forum_threads.is_locked, forum_threads.is_deleted,
                   ${forumShitpostSelect},
                   users.username AS author_name
            FROM forum_threads
            JOIN users ON users.id = forum_threads.author_user_id
            WHERE (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '')
            ORDER BY forum_threads.created_at DESC
            LIMIT ?`
    },
    {
      type: 'timeline_update',
      sql: `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body, timeline_updates.created_at,
                   timeline_updates.is_pinned, timeline_updates.is_hidden, timeline_updates.is_locked, timeline_updates.is_deleted,
                   users.username AS author_name
            FROM timeline_updates
            JOIN users ON users.id = timeline_updates.author_user_id
            ORDER BY timeline_updates.created_at DESC
            LIMIT ?`
    },
    {
      type: 'post',
      sql: `SELECT posts.id, posts.title, posts.body, posts.created_at,
                   posts.type, posts.is_private, posts.is_pinned, posts.is_hidden, posts.is_locked, posts.is_deleted,
                   users.username AS author_name
            FROM posts
            JOIN users ON users.id = posts.author_user_id
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
            ORDER BY projects.created_at DESC
            LIMIT ?`
    },
    {
      type: 'dev_log',
      sql: `SELECT dev_logs.id, dev_logs.title, dev_logs.body, dev_logs.created_at,
                   dev_logs.is_pinned, dev_logs.is_hidden, dev_logs.is_locked, dev_logs.is_deleted,
                   users.username AS author_name
            FROM dev_logs
            JOIN users ON users.id = dev_logs.author_user_id
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
        isShitpost: Boolean(row.is_shitpost),
        isPinned: Boolean(row.is_pinned),
        isHidden: Boolean(row.is_hidden),
        isLocked: Boolean(row.is_locked),
        isDeleted: Boolean(row.is_deleted),
        isPrivate: Boolean(row.is_private),
        updatesEnabled: row.updates_enabled ? Boolean(row.updates_enabled) : false,
        sectionLabel: labelForContentType(source.type, row),
        viewHref: viewPathForContent(source.type, row),
        editHref: editPathForContent(source.type, row),
        hideHref: hidePathForContent(source.type, row),
        lockHref: lockPathForContent(source.type, row),
        deleteHref: deletePathForContent(source.type, row),
        startsAt: row.starts_at || null,
        status: row.status || null
      });
    });
  });

  combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return combined.slice(0, limit);
}

async function loadRecentUsers(db, limit = 16) {
  const userColumns = await safeAll(db, "PRAGMA table_info('users')", []);
  const hasDeleted = userColumns.some((column) => column.name === 'is_deleted');
  const deletedSelect = hasDeleted ? 'users.is_deleted' : '0 as is_deleted';
  const rows = await safeAll(
    db,
    `SELECT users.id, users.username, users.role, users.created_at, users.last_seen, ${deletedSelect},
            (SELECT COUNT(*) FROM forum_threads WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM posts WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM timeline_updates WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM events WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM music_posts WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM projects WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM dev_logs WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) AS posts_count,
            (SELECT COUNT(*) FROM forum_replies WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM post_comments WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM timeline_comments WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM event_comments WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM music_comments WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM project_comments WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM project_replies WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) +
            (SELECT COUNT(*) FROM dev_log_comments WHERE author_user_id = users.id AND (is_deleted = 0 OR is_deleted IS NULL)) AS comments_count
     FROM users
     ORDER BY users.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.created_at,
    lastSeen: row.last_seen,
    isDeleted: Boolean(row.is_deleted),
    postsCount: row.posts_count || 0,
    commentsCount: row.comments_count || 0
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
    reporter: row.reporter,
    viewHref: viewPathForReportTarget(row.target_type, row.target_id)
  }));
}

async function loadMediaStats(db) {
  const tables = MEDIA_TABLES;
  const counts = await Promise.all(
    tables.map((entry) =>
      safeCount(db, `SELECT COUNT(*) as count FROM ${entry.table} WHERE image_key IS NOT NULL`, [])
    )
  );
  const galleryCount = await safeCount(db, 'SELECT COUNT(*) as count FROM user_gallery_images', []);
  const [forumRows, timelineRows, postRows, eventRows, musicRows, projectRows, devLogRows, galleryRows] = await Promise.all([
    safeAll(
      db,
      `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at, forum_threads.image_key, users.username AS author_name
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       WHERE forum_threads.image_key IS NOT NULL
         AND (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '')
       ORDER BY forum_threads.created_at DESC
       LIMIT 8`,
      []
    ),
    safeAll(
      db,
      `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.created_at, timeline_updates.image_key, users.username AS author_name
       FROM timeline_updates
       JOIN users ON users.id = timeline_updates.author_user_id
       WHERE timeline_updates.image_key IS NOT NULL
       ORDER BY timeline_updates.created_at DESC
       LIMIT 8`,
      []
    ),
    safeAll(
      db,
      `SELECT posts.id, posts.title, posts.created_at, posts.image_key, posts.type, users.username AS author_name
       FROM posts
       JOIN users ON users.id = posts.author_user_id
       WHERE posts.image_key IS NOT NULL
       ORDER BY posts.created_at DESC
       LIMIT 8`,
      []
    ),
    safeAll(
      db,
      `SELECT events.id, events.title, events.created_at, events.image_key, users.username AS author_name
       FROM events
       JOIN users ON users.id = events.author_user_id
       WHERE events.image_key IS NOT NULL
       ORDER BY events.created_at DESC
       LIMIT 8`,
      []
    ),
    safeAll(
      db,
      `SELECT music_posts.id, music_posts.title, music_posts.created_at, music_posts.image_key, users.username AS author_name
       FROM music_posts
       JOIN users ON users.id = music_posts.author_user_id
       WHERE music_posts.image_key IS NOT NULL
       ORDER BY music_posts.created_at DESC
       LIMIT 8`,
      []
    ),
    safeAll(
      db,
      `SELECT projects.id, projects.title, projects.created_at, projects.image_key, users.username AS author_name
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       WHERE projects.image_key IS NOT NULL
       ORDER BY projects.created_at DESC
       LIMIT 8`,
      []
    ),
    safeAll(
      db,
      `SELECT dev_logs.id, dev_logs.title, dev_logs.created_at, dev_logs.image_key, users.username AS author_name
       FROM dev_logs
       JOIN users ON users.id = dev_logs.author_user_id
       WHERE dev_logs.image_key IS NOT NULL
       ORDER BY dev_logs.created_at DESC
       LIMIT 8`,
      []
    ),
    safeAll(
      db,
      `SELECT user_gallery_images.id, user_gallery_images.created_at, user_gallery_images.image_key, users.username AS author_name
       FROM user_gallery_images
       JOIN users ON users.id = user_gallery_images.user_id
       ORDER BY user_gallery_images.created_at DESC
       LIMIT 8`,
      []
    )
  ]);

  const recent = [
    ...forumRows.map((row) => ({
      key: `forum_thread:${row.id}`,
      id: row.id,
      type: 'forum_thread',
      title: row.title,
      imageKey: row.image_key,
      createdAt: row.created_at,
      authorName: row.author_name,
      label: 'General',
      viewHref: viewPathForContent('forum_thread', row),
      editHref: editPathForContent('forum_thread', row)
    })),
    ...timelineRows.map((row) => ({
      key: `timeline_update:${row.id}`,
      id: row.id,
      type: 'timeline_update',
      title: row.title,
      imageKey: row.image_key,
      createdAt: row.created_at,
      authorName: row.author_name,
      label: 'Announcements',
      viewHref: viewPathForContent('timeline_update', row),
      editHref: editPathForContent('timeline_update', row)
    })),
    ...postRows.map((row) => ({
      key: `post:${row.id}`,
      id: row.id,
      type: 'post',
      title: row.title,
      imageKey: row.image_key,
      createdAt: row.created_at,
      authorName: row.author_name,
      label: labelForContentType('post', row),
      viewHref: viewPathForContent('post', row),
      editHref: editPathForContent('post', row)
    })),
    ...eventRows.map((row) => ({
      key: `event:${row.id}`,
      id: row.id,
      type: 'event',
      title: row.title,
      imageKey: row.image_key,
      createdAt: row.created_at,
      authorName: row.author_name,
      label: 'Events',
      viewHref: viewPathForContent('event', row),
      editHref: editPathForContent('event', row)
    })),
    ...musicRows.map((row) => ({
      key: `music_post:${row.id}`,
      id: row.id,
      type: 'music_post',
      title: row.title,
      imageKey: row.image_key,
      createdAt: row.created_at,
      authorName: row.author_name,
      label: 'Music',
      viewHref: viewPathForContent('music_post', row),
      editHref: editPathForContent('music_post', row)
    })),
    ...projectRows.map((row) => ({
      key: `project:${row.id}`,
      id: row.id,
      type: 'project',
      title: row.title,
      imageKey: row.image_key,
      createdAt: row.created_at,
      authorName: row.author_name,
      label: 'Projects',
      viewHref: viewPathForContent('project', row),
      editHref: editPathForContent('project', row)
    })),
    ...devLogRows.map((row) => ({
      key: `dev_log:${row.id}`,
      id: row.id,
      type: 'dev_log',
      title: row.title,
      imageKey: row.image_key,
      createdAt: row.created_at,
      authorName: row.author_name,
      label: 'Development',
      viewHref: viewPathForContent('dev_log', row),
      editHref: editPathForContent('dev_log', row)
    })),
    ...galleryRows.map((row) => ({
      key: `gallery:${row.id}`,
      id: row.id,
      type: 'gallery',
      title: 'Profile gallery image',
      imageKey: row.image_key,
      createdAt: row.created_at,
      authorName: row.author_name,
      label: 'Gallery',
      viewHref: `/profile/${row.author_name}`,
      editHref: null
    }))
  ]
    .filter((entry) => !!entry.imageKey)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 16);

  return {
    totals: tables.map((entry, index) => ({
      label: entry.label,
      count: counts[index] || 0
    })),
    galleryCount,
    recent
  };
}

async function loadRecentClickEvents(db, limit = 120) {
  const rows = await safeAll(
    db,
    `SELECT id, user_id, username, path, href, tag_name, target_label, created_at
     FROM click_events
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id || null,
    username: row.username || null,
    path: row.path || '',
    href: row.href || null,
    tagName: row.tag_name || null,
    label: row.target_label || null,
    createdAt: row.created_at || 0
  }));
}

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) {
    redirect('/');
  }

  const db = await getDb();
  const [stats, posts, actions, users, reports, media, clickEvents] = await Promise.all([
    gatherStats(db),
    loadRecentContent(db),
    getRecentAdminActions(db, 8),
    loadRecentUsers(db),
    loadOpenReports(db),
    loadMediaStats(db),
    loadRecentClickEvents(db)
  ]);

  return (
    <div className="admin-page stack">
      <AdminConsole
        stats={stats}
        posts={posts}
        actions={actions}
        users={users}
        reports={reports}
        media={media}
        clickEvents={clickEvents}
        user={user}
      />
    </div>
  );
}
