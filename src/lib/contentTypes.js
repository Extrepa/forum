// Central registry for content types and post types to keep routing/admin logic consistent.

export const POST_TYPES = {
  art: {
    label: 'Art',
    path: '/art',
    collectionPath: '/art-nostalgia'
  },
  nostalgia: {
    label: 'Nostalgia',
    path: '/nostalgia',
    collectionPath: '/art-nostalgia'
  },
  bugs: {
    label: 'Bugs',
    path: '/bugs',
    collectionPath: '/bugs-rant'
  },
  rant: {
    label: 'Rants',
    path: '/rant',
    collectionPath: '/bugs-rant'
  },
  lore: {
    label: 'Lore',
    path: '/lore',
    collectionPath: '/lore-memories'
  },
  memories: {
    label: 'Memories',
    path: '/memories',
    collectionPath: '/lore-memories'
  },
  about: {
    label: 'About',
    path: '/about',
    collectionPath: '/about'
  },
  nomads: {
    label: 'Nomads',
    path: '/nomads',
    collectionPath: '/nomads'
  }
};

export const POST_TYPE_KEYS = Object.keys(POST_TYPES);

export function isValidPostType(type) {
  return !!POST_TYPES[type];
}

export function postTypeLabel(type) {
  return POST_TYPES[type]?.label || 'Post';
}

export function postTypePath(type) {
  return POST_TYPES[type]?.path || '/posts';
}

export function postTypeCollectionPath(type) {
  return POST_TYPES[type]?.collectionPath || postTypePath(type);
}

export const CONTENT_TYPES = {
  forum_thread: {
    label: 'Forum',
    table: 'forum_threads',
    viewPath: (row) => `/lobby/${row.id}`,
    editApi: (row) => `/api/forum/${row.id}/edit`,
    hideApi: (row) => `/api/forum/${row.id}/hide`,
    lockApi: (row) => `/api/forum/${row.id}/lock`,
    deleteApi: (row) => `/api/forum/${row.id}/delete`
  },
  timeline_update: {
    label: 'Announcements',
    table: 'timeline_updates',
    viewPath: (row) => `/announcements/${row.id}`,
    editApi: (row) => `/api/timeline/${row.id}`,
    hideApi: (row) => `/api/timeline/${row.id}/hide`,
    lockApi: (row) => `/api/timeline/${row.id}/lock`,
    deleteApi: (row) => `/api/timeline/${row.id}/delete`
  },
  post: {
    label: 'Post',
    table: 'posts',
    viewPath: (row) => `${postTypePath(row.type)}/${row.id}`,
    editApi: (row) => `/api/posts/${row.id}`,
    hideApi: (row) => `/api/posts/${row.id}/hide`,
    lockApi: (row) => `/api/posts/${row.id}/lock`,
    deleteApi: (row) => `/api/posts/${row.id}/delete`
  },
  event: {
    label: 'Events',
    table: 'events',
    viewPath: (row) => `/events/${row.id}`,
    editApi: (row) => `/api/events/${row.id}`,
    hideApi: (row) => `/api/events/${row.id}/hide`,
    lockApi: (row) => `/api/events/${row.id}/lock`,
    deleteApi: (row) => `/api/events/${row.id}/delete`
  },
  music_post: {
    label: 'Music',
    table: 'music_posts',
    viewPath: (row) => `/music/${row.id}`,
    editApi: null,
    hideApi: (row) => `/api/music/${row.id}/hide`,
    lockApi: (row) => `/api/music/${row.id}/lock`,
    deleteApi: (row) => `/api/music/${row.id}/delete`
  },
  project: {
    label: 'Projects',
    table: 'projects',
    viewPath: (row) => `/projects/${row.id}`,
    editApi: (row) => `/api/projects/${row.id}`,
    hideApi: (row) => `/api/projects/${row.id}/hide`,
    lockApi: (row) => `/api/projects/${row.id}/lock`,
    deleteApi: (row) => `/api/projects/${row.id}/delete`
  },
  dev_log: {
    label: 'Development',
    table: 'dev_logs',
    viewPath: (row) => `/devlog/${row.id}`,
    editApi: (row) => `/api/devlog/${row.id}`,
    hideApi: (row) => `/api/devlog/${row.id}/hide`,
    lockApi: (row) => `/api/devlog/${row.id}/lock`,
    deleteApi: (row) => `/api/devlog/${row.id}/delete`
  }
};

export const CONTENT_TYPE_KEYS = Object.keys(CONTENT_TYPES);

export function isValidContentType(type) {
  return !!CONTENT_TYPES[type];
}

export function contentTypeTable(type) {
  return CONTENT_TYPES[type]?.table;
}

export function contentTypeLabel(type, row) {
  if (type === 'forum_thread') {
    return row?.is_shitpost ? 'Shitposts' : 'General';
  }
  if (type === 'post') {
    return postTypeLabel(row?.type);
  }
  return CONTENT_TYPES[type]?.label || 'Post';
}

export function contentTypeViewPath(type, row) {
  return CONTENT_TYPES[type]?.viewPath ? CONTENT_TYPES[type].viewPath(row) : '/';
}

export function contentTypeEditPath(type, row) {
  return CONTENT_TYPES[type]?.editApi ? CONTENT_TYPES[type].editApi(row) : null;
}

export function contentTypeHidePath(type, row) {
  return CONTENT_TYPES[type]?.hideApi ? CONTENT_TYPES[type].hideApi(row) : null;
}

export function contentTypeLockPath(type, row) {
  return CONTENT_TYPES[type]?.lockApi ? CONTENT_TYPES[type].lockApi(row) : null;
}

export function contentTypeDeletePath(type, row) {
  return CONTENT_TYPES[type]?.deleteApi ? CONTENT_TYPES[type].deleteApi(row) : null;
}

export const ADMIN_POST_TABLES = Object.values(CONTENT_TYPES).map((entry) => entry.table);

export const ADMIN_COMMENT_TABLES = [
  'forum_replies',
  'post_comments',
  'timeline_comments',
  'event_comments',
  'music_comments',
  'project_comments',
  'project_replies',
  'dev_log_comments'
];

export const ADMIN_LOCK_TABLES = [
  'forum_threads',
  'posts',
  'timeline_updates',
  'dev_logs'
];

export const MEDIA_TABLES = [
  { label: 'General', table: 'forum_threads' },
  { label: 'Posts', table: 'posts' },
  { label: 'Announcements', table: 'timeline_updates' },
  { label: 'Events', table: 'events' },
  { label: 'Music', table: 'music_posts' },
  { label: 'Projects', table: 'projects' },
  { label: 'Dev logs', table: 'dev_logs' }
];

export const LIKE_TARGET_TABLES = {
  forum_thread: 'forum_threads',
  music_post: 'music_posts',
  event: 'events',
  project: 'projects',
  dev_log: 'dev_logs',
  timeline_update: 'timeline_updates',
  post: 'posts',
  forum_reply: 'forum_replies',
  timeline_comment: 'timeline_comments',
  event_comment: 'event_comments',
  music_comment: 'music_comments',
  project_reply: 'project_replies',
  dev_log_comment: 'dev_log_comments',
  post_comment: 'post_comments'
};

export const LIKE_TARGET_TYPES = Object.keys(LIKE_TARGET_TABLES);

export function likeTargetTable(type) {
  return LIKE_TARGET_TABLES[type] || null;
}
