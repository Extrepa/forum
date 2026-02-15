import SearchClient from './SearchClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import { getSessionUser } from '../../lib/auth';
import { isDripNomad } from '../../lib/admin';

export default async function SearchResults({ query }) {
  if (!query) {
    return <SearchClient query="" results={[]} />;
  }

  const normalizedQuery = String(query).trim().toLowerCase();

  const user = await getSessionUser();
  const isSignedIn = !!user;
  const canViewNomads = isDripNomad(user);

  const db = await getDb();
  const searchTerm = `%${query}%`;
  const normalizedTerm = `%${String(query).toLowerCase()}%`;
  const signedInPostVisibility = canViewNomads
    ? '1=1'
    : "(posts.visibility_scope IS NULL OR posts.visibility_scope = 'members')";

  // Search forum threads
  let threads = [];
  try {
    const out = await db
      .prepare(
        `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                forum_threads.created_at, forum_threads.image_key,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
         FROM forum_threads
         JOIN users ON users.id = forum_threads.author_user_id
         WHERE forum_threads.moved_to_id IS NULL
           AND (forum_threads.is_hidden = 0 OR forum_threads.is_hidden IS NULL)
           AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
           AND (
             forum_threads.title LIKE ?
             OR forum_threads.body LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY forum_threads.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    threads = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                forum_threads.created_at, forum_threads.image_key,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
         FROM forum_threads
         JOIN users ON users.id = forum_threads.author_user_id
         WHERE (forum_threads.is_hidden = 0 OR forum_threads.is_hidden IS NULL)
           AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
           AND (
             forum_threads.title LIKE ?
             OR forum_threads.body LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY forum_threads.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    threads = out?.results || [];
  }

  // Search timeline updates
  let updates = [];
  try {
    const out = await db
      .prepare(
        `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body,
                timeline_updates.created_at, timeline_updates.image_key,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM timeline_updates
         JOIN users ON users.id = timeline_updates.author_user_id
         WHERE timeline_updates.moved_to_id IS NULL
           AND (timeline_updates.is_hidden = 0 OR timeline_updates.is_hidden IS NULL)
           AND (timeline_updates.is_deleted = 0 OR timeline_updates.is_deleted IS NULL)
           AND (
             timeline_updates.title LIKE ?
             OR timeline_updates.body LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY timeline_updates.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    updates = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body,
                timeline_updates.created_at, timeline_updates.image_key,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM timeline_updates
         JOIN users ON users.id = timeline_updates.author_user_id
         WHERE (timeline_updates.is_hidden = 0 OR timeline_updates.is_hidden IS NULL)
           AND (timeline_updates.is_deleted = 0 OR timeline_updates.is_deleted IS NULL)
           AND (
             timeline_updates.title LIKE ?
             OR timeline_updates.body LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY timeline_updates.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    updates = out?.results || [];
  }

  // Search events
  let events = [];
  try {
    const out = await db
      .prepare(
        `SELECT events.id, events.title, events.details, events.starts_at,
                events.created_at, events.image_key,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM events
         JOIN users ON users.id = events.author_user_id
         WHERE events.moved_to_id IS NULL
           AND (events.is_hidden = 0 OR events.is_hidden IS NULL)
           AND (events.is_deleted = 0 OR events.is_deleted IS NULL)
           AND (${canViewNomads ? "1=1" : "(events.visibility_scope IS NULL OR events.visibility_scope = 'members')"})
           AND (
             events.title LIKE ?
             OR events.details LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY events.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    events = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT events.id, events.title, events.details, events.starts_at,
                events.created_at, events.image_key,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM events
         JOIN users ON users.id = events.author_user_id
         WHERE (events.is_hidden = 0 OR events.is_hidden IS NULL)
           AND (events.is_deleted = 0 OR events.is_deleted IS NULL)
           AND (${canViewNomads ? "1=1" : "(events.visibility_scope IS NULL OR events.visibility_scope = 'members')"})
           AND (
             events.title LIKE ?
             OR events.details LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY events.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    events = out?.results || [];
  }

  // Search music posts
  let music = [];
  try {
    const out = await db
      .prepare(
        `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
                music_posts.type, music_posts.tags, music_posts.image_key,
                music_posts.created_at, users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM music_posts
         JOIN users ON users.id = music_posts.author_user_id
         WHERE music_posts.moved_to_id IS NULL
           AND (music_posts.is_hidden = 0 OR music_posts.is_hidden IS NULL)
           AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)
           AND (
             music_posts.title LIKE ?
             OR music_posts.body LIKE ?
             OR music_posts.tags LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY music_posts.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    music = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
                music_posts.type, music_posts.tags, music_posts.image_key,
                music_posts.created_at, users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM music_posts
         JOIN users ON users.id = music_posts.author_user_id
         WHERE (music_posts.is_hidden = 0 OR music_posts.is_hidden IS NULL)
           AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)
           AND (
             music_posts.title LIKE ?
             OR music_posts.body LIKE ?
             OR music_posts.tags LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY music_posts.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    music = out?.results || [];
  }

  // Search projects
  let projects = [];
  try {
    const out = await db
      .prepare(
        `SELECT projects.id, projects.title, projects.description, projects.status,
                projects.github_url, projects.demo_url, projects.image_key,
                projects.created_at, users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM projects
         JOIN users ON users.id = projects.author_user_id
         WHERE projects.moved_to_id IS NULL
           AND (projects.is_hidden = 0 OR projects.is_hidden IS NULL)
           AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)
           AND (
             projects.title LIKE ?
             OR projects.description LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY projects.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    projects = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT projects.id, projects.title, projects.description, projects.status,
                projects.github_url, projects.demo_url, projects.image_key,
                projects.created_at, users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM projects
         JOIN users ON users.id = projects.author_user_id
         WHERE (projects.is_hidden = 0 OR projects.is_hidden IS NULL)
           AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)
           AND (
             projects.title LIKE ?
             OR projects.description LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY projects.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    projects = out?.results || [];
  }

  // Search dev logs
  let devLogs = [];
  try {
    const out = await db
      .prepare(
        `SELECT dev_logs.id, dev_logs.title, dev_logs.body, dev_logs.image_key,
                dev_logs.created_at, users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM dev_logs
         JOIN users ON users.id = dev_logs.author_user_id
         WHERE (dev_logs.is_hidden = 0 OR dev_logs.is_hidden IS NULL)
           AND (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL)
           AND (
             dev_logs.title LIKE ?
             OR dev_logs.body LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY dev_logs.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    devLogs = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT dev_logs.id, dev_logs.title, dev_logs.body, dev_logs.image_key,
                dev_logs.created_at, users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM dev_logs
         JOIN users ON users.id = dev_logs.author_user_id
         WHERE (
             dev_logs.title LIKE ?
             OR dev_logs.body LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
         ORDER BY dev_logs.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    devLogs = out?.results || [];
  }

  // Search forum replies
  let replies = [];
  try {
    const out = await db
      .prepare(
        `SELECT forum_replies.id, forum_replies.body, forum_replies.created_at,
                forum_replies.thread_id, users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                forum_threads.title AS thread_title
         FROM forum_replies
         JOIN users ON users.id = forum_replies.author_user_id
         JOIN forum_threads ON forum_threads.id = forum_replies.thread_id
         WHERE (
             forum_replies.body LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
           AND forum_replies.is_deleted = 0
           AND forum_threads.moved_to_id IS NULL
           AND (forum_threads.is_hidden = 0 OR forum_threads.is_hidden IS NULL)
           AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
         ORDER BY forum_replies.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, normalizedTerm)
      .all();
    replies = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT forum_replies.id, forum_replies.body, forum_replies.created_at,
                forum_replies.thread_id, users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                forum_threads.title AS thread_title
         FROM forum_replies
         JOIN users ON users.id = forum_replies.author_user_id
         JOIN forum_threads ON forum_threads.id = forum_replies.thread_id
         WHERE (
             forum_replies.body LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           ) AND forum_replies.is_deleted = 0
           AND (forum_threads.is_hidden = 0 OR forum_threads.is_hidden IS NULL)
           AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
         ORDER BY forum_replies.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, normalizedTerm)
      .all();
    replies = out?.results || [];
  }

  // Search additional comments/replies across the forum
  const safeSearchAll = async (sql, ...binds) => {
    try {
      const out = await db.prepare(sql).bind(...binds).all();
      return out?.results || [];
    } catch (e) {
      return [];
    }
  };

  const [
    devLogComments,
    timelineComments,
    eventComments,
    musicComments,
    projectReplies,
    projectComments,
    postComments,
  ] = await Promise.all([
    safeSearchAll(
      `SELECT dev_log_comments.id, dev_log_comments.body, dev_log_comments.created_at,
              dev_log_comments.log_id AS parent_id, users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              dev_logs.title AS thread_title, 'devlog' AS parent_type
       FROM dev_log_comments
       JOIN users ON users.id = dev_log_comments.author_user_id
       JOIN dev_logs ON dev_logs.id = dev_log_comments.log_id
       WHERE (
           dev_log_comments.body LIKE ?
           OR users.username LIKE ?
           OR users.username_norm LIKE ?
         )
         AND (dev_log_comments.is_deleted = 0 OR dev_log_comments.is_deleted IS NULL)
         AND (dev_logs.is_hidden = 0 OR dev_logs.is_hidden IS NULL)
         AND (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL)
       ORDER BY dev_log_comments.created_at DESC
       LIMIT 20`,
      searchTerm, searchTerm, normalizedTerm
    ),
    safeSearchAll(
      `SELECT timeline_comments.id, timeline_comments.body, timeline_comments.created_at,
              timeline_comments.update_id AS parent_id, users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              timeline_updates.title AS thread_title, 'announcement' AS parent_type
       FROM timeline_comments
       JOIN users ON users.id = timeline_comments.author_user_id
       JOIN timeline_updates ON timeline_updates.id = timeline_comments.update_id
       WHERE (
           timeline_comments.body LIKE ?
           OR users.username LIKE ?
           OR users.username_norm LIKE ?
         )
         AND (timeline_comments.is_deleted = 0 OR timeline_comments.is_deleted IS NULL)
         AND (timeline_updates.is_hidden = 0 OR timeline_updates.is_hidden IS NULL)
         AND (timeline_updates.is_deleted = 0 OR timeline_updates.is_deleted IS NULL)
       ORDER BY timeline_comments.created_at DESC
       LIMIT 20`,
      searchTerm, searchTerm, normalizedTerm
    ),
    safeSearchAll(
      `SELECT event_comments.id, event_comments.body, event_comments.created_at,
              event_comments.event_id AS parent_id, users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              events.title AS thread_title, 'event' AS parent_type
       FROM event_comments
       JOIN users ON users.id = event_comments.author_user_id
       JOIN events ON events.id = event_comments.event_id
       WHERE (
           event_comments.body LIKE ?
           OR users.username LIKE ?
           OR users.username_norm LIKE ?
         )
         AND (event_comments.is_deleted = 0 OR event_comments.is_deleted IS NULL)
         AND (events.is_hidden = 0 OR events.is_hidden IS NULL)
         AND (events.is_deleted = 0 OR events.is_deleted IS NULL)
       ORDER BY event_comments.created_at DESC
       LIMIT 20`,
      searchTerm, searchTerm, normalizedTerm
    ),
    safeSearchAll(
      `SELECT music_comments.id, music_comments.body, music_comments.created_at,
              music_comments.post_id AS parent_id, users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              music_posts.title AS thread_title, 'music' AS parent_type
       FROM music_comments
       JOIN users ON users.id = music_comments.author_user_id
       JOIN music_posts ON music_posts.id = music_comments.post_id
       WHERE (
           music_comments.body LIKE ?
           OR users.username LIKE ?
           OR users.username_norm LIKE ?
         )
         AND (music_comments.is_deleted = 0 OR music_comments.is_deleted IS NULL)
         AND (music_posts.is_hidden = 0 OR music_posts.is_hidden IS NULL)
         AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)
       ORDER BY music_comments.created_at DESC
       LIMIT 20`,
      searchTerm, searchTerm, normalizedTerm
    ),
    safeSearchAll(
      `SELECT project_replies.id, project_replies.body, project_replies.created_at,
              project_replies.project_id AS parent_id, users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              projects.title AS thread_title, 'project' AS parent_type
       FROM project_replies
       JOIN users ON users.id = project_replies.author_user_id
       JOIN projects ON projects.id = project_replies.project_id
       WHERE (
           project_replies.body LIKE ?
           OR users.username LIKE ?
           OR users.username_norm LIKE ?
         )
         AND (project_replies.is_deleted = 0 OR project_replies.is_deleted IS NULL)
         AND (projects.is_hidden = 0 OR projects.is_hidden IS NULL)
         AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)
       ORDER BY project_replies.created_at DESC
       LIMIT 20`,
      searchTerm, searchTerm, normalizedTerm
    ),
    safeSearchAll(
      `SELECT project_comments.id, project_comments.body, project_comments.created_at,
              project_comments.project_id AS parent_id, users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              projects.title AS thread_title, 'project' AS parent_type
       FROM project_comments
       JOIN users ON users.id = project_comments.author_user_id
       JOIN projects ON projects.id = project_comments.project_id
       WHERE (
           project_comments.body LIKE ?
           OR users.username LIKE ?
           OR users.username_norm LIKE ?
         )
         AND (project_comments.is_deleted = 0 OR project_comments.is_deleted IS NULL)
         AND (projects.is_hidden = 0 OR projects.is_hidden IS NULL)
         AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)
       ORDER BY project_comments.created_at DESC
       LIMIT 20`,
      searchTerm, searchTerm, normalizedTerm
    ),
    safeSearchAll(
      `SELECT post_comments.id, post_comments.body, post_comments.created_at,
              post_comments.post_id AS parent_id, users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              posts.title AS thread_title, posts.type AS post_type, 'post' AS parent_type
       FROM post_comments
       JOIN users ON users.id = post_comments.author_user_id
       JOIN posts ON posts.id = post_comments.post_id
       WHERE (
           post_comments.body LIKE ?
           OR users.username LIKE ?
           OR users.username_norm LIKE ?
         )
         AND (post_comments.is_deleted = 0 OR post_comments.is_deleted IS NULL)
         AND (posts.is_hidden = 0 OR posts.is_hidden IS NULL)
         AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL)
         AND (${signedInPostVisibility})
       ORDER BY post_comments.created_at DESC
       LIMIT 20`,
      searchTerm, searchTerm, normalizedTerm
    ),
  ]);

  replies = [
    ...replies,
    ...devLogComments,
    ...timelineComments,
    ...eventComments,
    ...musicComments,
    ...projectReplies,
    ...projectComments,
    ...postComments,
  ];

  // Search shared posts (art/bugs/rant/nostalgia/lore/memories)
  let posts = [];
  try {
    const out = await db
      .prepare(
        `SELECT posts.id, posts.type, posts.title, posts.body, posts.image_key, posts.is_private,
                posts.created_at, users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE (
             posts.title LIKE ?
             OR posts.body LIKE ?
             OR users.username LIKE ?
             OR users.username_norm LIKE ?
           )
           AND (posts.is_hidden = 0 OR posts.is_hidden IS NULL)
           AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL)
           AND (${signedInPostVisibility})
         ORDER BY posts.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm, normalizedTerm)
      .all();
    posts = out?.results || [];
  } catch (e) {
    posts = [];
  }

  // Search users
  let users = [];
  try {
    const out = await db
      .prepare(
        `SELECT users.id, users.username, users.created_at, users.preferred_username_color_index AS author_color_preference
         FROM users
         WHERE (users.username LIKE ? OR users.username_norm LIKE ?)
           AND (users.is_deleted = 0 OR users.is_deleted IS NULL)
         ORDER BY users.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, normalizedTerm)
      .all();
    users = out?.results || [];
  } catch (e) {
    try {
      const out = await db
        .prepare(
          `SELECT users.id, users.username, users.created_at, users.preferred_username_color_index AS author_color_preference
           FROM users
           WHERE (users.username LIKE ? OR users.username_norm LIKE ?)
           ORDER BY users.created_at DESC
           LIMIT 20`
        )
        .bind(searchTerm, normalizedTerm)
        .all();
      users = out?.results || [];
    } catch (e2) {
      users = [];
    }
  }

  // Pre-render markdown for results
  const processedThreads = threads.map(t => ({
    ...t,
    bodyHtml: renderMarkdown(t.body),
    type: 'thread',
    url: `/lobby/${t.id}`
  }));

  const processedUpdates = updates.map(u => ({
    ...u,
    bodyHtml: renderMarkdown(u.body),
    type: 'announcement',
    url: `/announcements/${u.id}`
  }));

  const processedEvents = events.map(e => ({
    ...e,
    detailsHtml: e.details ? renderMarkdown(e.details) : null,
    type: 'event',
    url: `/events/${e.id}`
  }));

  const processedMusic = music.map(m => ({
    ...m,
    bodyHtml: m.body ? renderMarkdown(m.body) : null,
    type: 'music',
    url: `/music/${m.id}`
  }));

  const processedProjects = projects.map(p => ({
    ...p,
    descriptionHtml: renderMarkdown(p.description.substring(0, 200) + (p.description.length > 200 ? '...' : '')),
    type: 'project',
    url: `/projects/${p.id}`
  }));

  const processedDevLogs = devLogs.map((d) => ({
    ...d,
    bodyHtml: d.body ? renderMarkdown(d.body) : null,
    type: 'devlog',
    url: `/devlog/${d.id}`,
  }));

  const processedReplies = replies.map((r) => {
    const parentId = r.thread_id || r.parent_id;
    let url = `/lobby/${parentId}`;
    if (r.parent_type === 'devlog') url = `/devlog/${parentId}`;
    else if (r.parent_type === 'announcement') url = `/announcements/${parentId}`;
    else if (r.parent_type === 'event') url = `/events/${parentId}`;
    else if (r.parent_type === 'music') url = `/music/${parentId}`;
    else if (r.parent_type === 'project') url = `/projects/${parentId}`;
    else if (r.parent_type === 'post') {
      if (r.post_type === 'lore' || r.post_type === 'memories') url = `/lore-memories/${parentId}`;
      else if (r.post_type === 'nomads') url = `/nomads/${parentId}`;
      else if (r.post_type === 'about') url = '/about';
      else url = `/${r.post_type}/${parentId}`;
    }
    return {
      ...r,
      bodyHtml: renderMarkdown(r.body),
      type: 'reply',
      url
    };
  });

  const labelForShared = (t) => {
    const labels = {
      art: 'art',
      bugs: 'bugs',
      rant: 'rant',
      nostalgia: 'nostalgia',
      lore: 'lore',
      memories: 'memories',
      nomads: 'nomads',
      about: 'about',
    };
    return labels[t] || t;
  };

  const processedPosts = posts.map(p => {
    // Route lore and memories posts to combined page
    let url;
    if (p.type === 'lore' || p.type === 'memories') {
      url = `/lore-memories/${p.id}`;
    } else if (p.type === 'nomads') {
      url = `/nomads/${p.id}`;
    } else if (p.type === 'about') {
      url = '/about';
    } else {
      url = `/${p.type}/${p.id}`;
    }
    return {
      ...p,
      bodyHtml: p.body ? renderMarkdown(p.body) : null,
      type: labelForShared(p.type),
      url
    };
  });

  const processedUsers = users.map((u) => ({
    ...u,
    title: u.username,
    author_name: u.username,
    author_color_preference: u.author_color_preference,
    type: 'user',
    url: `/profile/${encodeURIComponent(u.username)}`
  }));

  const getResultRank = (result) => {
    const normalizedAuthor = String(result.author_name || '').toLowerCase();
    const normalizedTitle = String(result.title || result.thread_title || '').toLowerCase();
    const normalizedBody = String(result.body || '').toLowerCase();
    let rank = 0;

    if (normalizedAuthor === normalizedQuery) rank += 100;
    else if (normalizedAuthor.includes(normalizedQuery)) rank += 45;

    if (result.type === 'user' && normalizedTitle === normalizedQuery) rank += 120;
    else if (result.type === 'user' && normalizedTitle.includes(normalizedQuery)) rank += 55;

    if (normalizedTitle.includes(normalizedQuery)) rank += 20;
    if (normalizedBody.includes(normalizedQuery)) rank += 8;

    return rank;
  };

  const allResults = [
    ...processedThreads,
    ...processedUpdates,
    ...processedEvents,
    ...processedMusic,
    ...processedProjects,
    ...processedDevLogs,
    ...processedReplies,
    ...processedPosts,
    ...processedUsers
  ].sort((a, b) => {
    const rankDiff = getResultRank(b) - getResultRank(a);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return <SearchClient query={query} results={allResults} />;
}
