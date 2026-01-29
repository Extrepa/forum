import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || !query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const user = await getSessionUser();
  const isSignedIn = !!user;

  const db = await getDb();
  const searchTerm = `%${query.trim()}%`;

  // Search forum threads
  let threads = [];
  try {
    const out = await db
      .prepare(
        `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                forum_threads.created_at, forum_threads.image_key,
                users.username AS author_name,
                (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
         FROM forum_threads
         JOIN users ON users.id = forum_threads.author_user_id
         WHERE forum_threads.moved_to_id IS NULL
           AND (forum_threads.is_hidden = 0 OR forum_threads.is_hidden IS NULL)
           AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
           AND (forum_threads.title LIKE ? OR forum_threads.body LIKE ?)
         ORDER BY forum_threads.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm)
      .all();
    threads = out?.results || [];
  } catch (e) {
    try {
      const out = await db
        .prepare(
          `SELECT forum_threads.id, forum_threads.title, forum_threads.body,
                  forum_threads.created_at, forum_threads.image_key,
                  users.username AS author_name,
                  (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.thread_id = forum_threads.id AND forum_replies.is_deleted = 0) AS reply_count
           FROM forum_threads
           JOIN users ON users.id = forum_threads.author_user_id
           WHERE (forum_threads.is_hidden = 0 OR forum_threads.is_hidden IS NULL)
             AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
             AND (forum_threads.title LIKE ? OR forum_threads.body LIKE ?)
           ORDER BY forum_threads.created_at DESC
           LIMIT 20`
        )
        .bind(searchTerm, searchTerm)
        .all();
      threads = out?.results || [];
    } catch (e2) {
      threads = [];
    }
  }

  // Search timeline updates
  let updates = [];
  try {
    const out = await db
      .prepare(
        `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body,
                timeline_updates.created_at, timeline_updates.image_key,
                users.username AS author_name
         FROM timeline_updates
         JOIN users ON users.id = timeline_updates.author_user_id
         WHERE timeline_updates.moved_to_id IS NULL
           AND (timeline_updates.is_hidden = 0 OR timeline_updates.is_hidden IS NULL)
           AND (timeline_updates.is_deleted = 0 OR timeline_updates.is_deleted IS NULL)
           AND (timeline_updates.title LIKE ? OR timeline_updates.body LIKE ?)
         ORDER BY timeline_updates.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm)
      .all();
    updates = out?.results || [];
  } catch (e) {
    try {
      const out = await db
        .prepare(
          `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body,
                  timeline_updates.created_at, timeline_updates.image_key,
                  users.username AS author_name
           FROM timeline_updates
           JOIN users ON users.id = timeline_updates.author_user_id
           WHERE (timeline_updates.is_hidden = 0 OR timeline_updates.is_hidden IS NULL)
             AND (timeline_updates.is_deleted = 0 OR timeline_updates.is_deleted IS NULL)
             AND (timeline_updates.title LIKE ? OR timeline_updates.body LIKE ?)
           ORDER BY timeline_updates.created_at DESC
           LIMIT 20`
        )
        .bind(searchTerm, searchTerm)
        .all();
      updates = out?.results || [];
    } catch (e2) {
      updates = [];
    }
  }

  // Search events
  let events = [];
  try {
    const out = await db
      .prepare(
        `SELECT events.id, events.title, events.details, events.starts_at,
                events.created_at, events.image_key,
                users.username AS author_name
         FROM events
         JOIN users ON users.id = events.author_user_id
         WHERE events.moved_to_id IS NULL
           AND (events.is_hidden = 0 OR events.is_hidden IS NULL)
           AND (events.is_deleted = 0 OR events.is_deleted IS NULL)
           AND (events.title LIKE ? OR events.details LIKE ?)
         ORDER BY events.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm)
      .all();
    events = out?.results || [];
  } catch (e) {
    try {
      const out = await db
        .prepare(
          `SELECT events.id, events.title, events.details, events.starts_at,
                  events.created_at, events.image_key,
                  users.username AS author_name
           FROM events
           JOIN users ON users.id = events.author_user_id
           WHERE (events.is_hidden = 0 OR events.is_hidden IS NULL)
             AND (events.is_deleted = 0 OR events.is_deleted IS NULL)
             AND (events.title LIKE ? OR events.details LIKE ?)
           ORDER BY events.created_at DESC
           LIMIT 20`
        )
        .bind(searchTerm, searchTerm)
        .all();
      events = out?.results || [];
    } catch (e2) {
      events = [];
    }
  }

  // Search music posts
  let music = [];
  try {
    const out = await db
      .prepare(
        `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
                music_posts.type, music_posts.tags, music_posts.image_key,
                music_posts.created_at, users.username AS author_name
         FROM music_posts
         JOIN users ON users.id = music_posts.author_user_id
         WHERE music_posts.moved_to_id IS NULL
           AND (music_posts.is_hidden = 0 OR music_posts.is_hidden IS NULL)
           AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)
           AND (music_posts.title LIKE ? OR music_posts.body LIKE ? OR music_posts.tags LIKE ?)
         ORDER BY music_posts.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm, searchTerm)
      .all();
    music = out?.results || [];
  } catch (e) {
    try {
      const out = await db
        .prepare(
          `SELECT music_posts.id, music_posts.title, music_posts.body, music_posts.url,
                  music_posts.type, music_posts.tags, music_posts.image_key,
                  music_posts.created_at, users.username AS author_name
           FROM music_posts
           JOIN users ON users.id = music_posts.author_user_id
           WHERE (music_posts.is_hidden = 0 OR music_posts.is_hidden IS NULL)
             AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)
             AND (music_posts.title LIKE ? OR music_posts.body LIKE ? OR music_posts.tags LIKE ?)
           ORDER BY music_posts.created_at DESC
           LIMIT 20`
        )
        .bind(searchTerm, searchTerm, searchTerm)
        .all();
      music = out?.results || [];
    } catch (e2) {
      music = [];
    }
  }

  // Search projects
  let projects = [];
  try {
    const out = await db
      .prepare(
        `SELECT projects.id, projects.title, projects.description, projects.status,
                projects.github_url, projects.demo_url, projects.image_key,
                projects.created_at, users.username AS author_name
         FROM projects
         JOIN users ON users.id = projects.author_user_id
         WHERE projects.moved_to_id IS NULL
           AND (projects.is_hidden = 0 OR projects.is_hidden IS NULL)
           AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)
           AND (projects.title LIKE ? OR projects.description LIKE ?)
         ORDER BY projects.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm)
      .all();
    projects = out?.results || [];
  } catch (e) {
    try {
      const out = await db
        .prepare(
          `SELECT projects.id, projects.title, projects.description, projects.status,
                  projects.github_url, projects.demo_url, projects.image_key,
                  projects.created_at, users.username AS author_name
           FROM projects
           JOIN users ON users.id = projects.author_user_id
           WHERE (projects.is_hidden = 0 OR projects.is_hidden IS NULL)
             AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)
             AND (projects.title LIKE ? OR projects.description LIKE ?)
           ORDER BY projects.created_at DESC
           LIMIT 20`
        )
        .bind(searchTerm, searchTerm)
        .all();
      projects = out?.results || [];
    } catch (e2) {
      projects = [];
    }
  }

  // Search forum replies
  let replies = [];
  try {
    const out = await db
      .prepare(
        `SELECT forum_replies.id, forum_replies.body, forum_replies.created_at,
                forum_replies.thread_id, users.username AS author_name,
                forum_threads.title AS thread_title
         FROM forum_replies
         JOIN users ON users.id = forum_replies.author_user_id
         JOIN forum_threads ON forum_threads.id = forum_replies.thread_id
         WHERE forum_replies.body LIKE ?
           AND forum_replies.is_deleted = 0
           AND forum_threads.moved_to_id IS NULL
           AND (forum_threads.is_hidden = 0 OR forum_threads.is_hidden IS NULL)
           AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
         ORDER BY forum_replies.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm)
      .all();
    replies = out?.results || [];
  } catch (e) {
    try {
      const out = await db
        .prepare(
          `SELECT forum_replies.id, forum_replies.body, forum_replies.created_at,
                  forum_replies.thread_id, users.username AS author_name,
                  forum_threads.title AS thread_title
           FROM forum_replies
           JOIN users ON users.id = forum_replies.author_user_id
           JOIN forum_threads ON forum_threads.id = forum_replies.thread_id
           WHERE forum_replies.body LIKE ? AND forum_replies.is_deleted = 0
             AND (forum_threads.is_hidden = 0 OR forum_threads.is_hidden IS NULL)
             AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
           ORDER BY forum_replies.created_at DESC
           LIMIT 20`
        )
        .bind(searchTerm)
        .all();
      replies = out?.results || [];
    } catch (e2) {
      replies = [];
    }
  }

  // Search shared posts (art/bugs/rant/nostalgia/lore/memories)
  let posts = [];
  try {
    const out = await db
      .prepare(
        `SELECT posts.id, posts.type, posts.title, posts.body, posts.image_key, posts.is_private,
                posts.created_at, users.username AS author_name
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE (posts.title LIKE ? OR posts.body LIKE ?)
           AND (posts.is_hidden = 0 OR posts.is_hidden IS NULL)
           AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL)
           AND (${isSignedIn ? '1=1' : "posts.is_private = 0 AND posts.type NOT IN ('lore','memories')"})
         ORDER BY posts.created_at DESC
         LIMIT 20`
      )
      .bind(searchTerm, searchTerm)
      .all();
    posts = out?.results || [];
  } catch (e) {
    posts = [];
  }

  // Process results
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

  const processedReplies = replies.map(r => ({
    ...r,
    bodyHtml: renderMarkdown(r.body),
    type: 'reply',
    url: `/lobby/${r.thread_id}`
  }));

  const labelForShared = (t) => {
    const labels = {
      art: 'art',
      bugs: 'bugs',
      rant: 'rant',
      nostalgia: 'nostalgia',
      lore: 'lore',
      memories: 'memories',
      about: 'about',
    };
    return labels[t] || t;
  };

  const processedPosts = posts.map(p => {
    let url;
    if (p.type === 'lore' || p.type === 'memories') {
      url = `/lore-memories/${p.id}`;
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

  const allResults = [
    ...processedThreads,
    ...processedUpdates,
    ...processedEvents,
    ...processedMusic,
    ...processedProjects,
    ...processedReplies,
    ...processedPosts
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return NextResponse.json({ results: allResults });
}
