import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

function destPathFor(type, id) {
  switch (type) {
    case 'forum_thread':
      return `/forum/${id}`;
    case 'project':
      return `/projects/${id}`;
    case 'music_post':
      return `/music/${id}`;
    case 'timeline_update':
      return `/timeline/${id}`;
    case 'event':
      return `/events/${id}`;
    case 'dev_log':
      return `/devlog/${id}`;
    default:
      return null;
  }
}

function normalizeType(raw) {
  const t = String(raw || '').trim();
  if (!t) return null;
  return t;
}

function parseSource(input) {
  const value = String(input || '').trim();
  if (!value) return null;

  // Accept either full URL or path, e.g. https://forum.errl.wtf/forum/<id> or /forum/<id>
  const path = value.includes('://') ? new URL(value).pathname : value;
  const parts = path.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const section = parts[0];
  const id = parts[1];
  switch (section) {
    case 'forum':
      return { type: 'forum_thread', id };
    case 'projects':
      return { type: 'project', id };
    case 'music':
      return { type: 'music_post', id };
    case 'timeline':
      return { type: 'timeline_update', id };
    case 'events':
      return { type: 'event', id };
    case 'devlog':
      return { type: 'dev_log', id };
    default:
      return null;
  }
}

async function getMoveTarget(db, sourceType, sourceId) {
  try {
    const existing = await db
      .prepare('SELECT dest_type, dest_id FROM content_moves WHERE source_type = ? AND source_id = ?')
      .bind(sourceType, sourceId)
      .first();
    if (existing?.dest_type && existing?.dest_id) {
      return { type: existing.dest_type, id: existing.dest_id };
    }
    return null;
  } catch (e) {
    // Migrations not applied yet.
    return null;
  }
}

async function markMoved(db, { sourceType, sourceId, destType, destId, movedByUserId, movedAt }) {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO content_moves
        (id, source_type, source_id, dest_type, dest_id, moved_by_user_id, moved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, sourceType, sourceId, destType, destId, movedByUserId, movedAt)
    .run();

  const table = {
    forum_thread: 'forum_threads',
    project: 'projects',
    music_post: 'music_posts',
    timeline_update: 'timeline_updates',
    event: 'events',
    dev_log: 'dev_logs',
  }[sourceType];

  if (!table) return;

  await db
    .prepare(
      `UPDATE ${table}
       SET moved_to_type = ?, moved_to_id = ?, moved_at = ?, moved_by_user_id = ?
       WHERE id = ?`
    )
    .bind(destType, destId, movedAt, movedByUserId, sourceId)
    .run();
}

async function fetchSource(db, type, id) {
  switch (type) {
    case 'forum_thread':
      return db
        .prepare(
          'SELECT id, author_user_id, title, body, created_at, updated_at, image_key, moved_to_id FROM forum_threads WHERE id = ?'
        )
        .bind(id)
        .first();
    case 'project':
      return db
        .prepare(
          'SELECT id, author_user_id, title, description, status, github_url, demo_url, image_key, created_at, updated_at, moved_to_id FROM projects WHERE id = ?'
        )
        .bind(id)
        .first();
    case 'music_post':
      return db
        .prepare(
          'SELECT id, author_user_id, title, body, url, type, tags, image_key, created_at, moved_to_id FROM music_posts WHERE id = ?'
        )
        .bind(id)
        .first();
    case 'timeline_update':
      return db
        .prepare(
          'SELECT id, author_user_id, title, body, created_at, updated_at, is_pinned, image_key, moved_to_id FROM timeline_updates WHERE id = ?'
        )
        .bind(id)
        .first();
    case 'event':
      return db
        .prepare(
          'SELECT id, author_user_id, title, details, starts_at, created_at, image_key, moved_to_id FROM events WHERE id = ?'
        )
        .bind(id)
        .first();
    case 'dev_log':
      return db
        .prepare(
          'SELECT id, author_user_id, title, body, image_key, created_at, updated_at, is_locked, moved_to_id FROM dev_logs WHERE id = ?'
        )
        .bind(id)
        .first();
    default:
      return null;
  }
}

async function migrateDiscussion(db, { sourceType, sourceId, destType, destId }) {
  // Read source discussion items (replies/comments)
  const sourceItems = [];
  if (sourceType === 'forum_thread') {
    const { results } = await db
      .prepare(
        'SELECT author_user_id, body, created_at FROM forum_replies WHERE thread_id = ? AND is_deleted = 0 ORDER BY created_at ASC'
      )
      .bind(sourceId)
      .all();
    for (const r of results || []) sourceItems.push(r);
  } else if (sourceType === 'project') {
    const { results } = await db
      .prepare(
        'SELECT author_user_id, body, created_at FROM project_comments WHERE project_id = ? AND is_deleted = 0 ORDER BY created_at ASC'
      )
      .bind(sourceId)
      .all();
    for (const r of results || []) sourceItems.push(r);
  } else if (sourceType === 'music_post') {
    const { results } = await db
      .prepare(
        'SELECT author_user_id, body, created_at FROM music_comments WHERE post_id = ? AND is_deleted = 0 ORDER BY created_at ASC'
      )
      .bind(sourceId)
      .all();
    for (const r of results || []) sourceItems.push(r);
  } else if (sourceType === 'timeline_update') {
    const { results } = await db
      .prepare(
        'SELECT author_user_id, body, created_at FROM timeline_comments WHERE update_id = ? AND is_deleted = 0 ORDER BY created_at ASC'
      )
      .bind(sourceId)
      .all();
    for (const r of results || []) sourceItems.push(r);
  } else if (sourceType === 'dev_log') {
    const { results } = await db
      .prepare(
        'SELECT author_user_id, body, created_at FROM dev_log_comments WHERE log_id = ? AND is_deleted = 0 ORDER BY created_at ASC'
      )
      .bind(sourceId)
      .all();
    for (const r of results || []) sourceItems.push(r);
  } else if (sourceType === 'event') {
    const { results } = await db
      .prepare(
        'SELECT author_user_id, body, created_at FROM event_comments WHERE event_id = ? AND is_deleted = 0 ORDER BY created_at ASC'
      )
      .bind(sourceId)
      .all();
    for (const r of results || []) sourceItems.push(r);
  }

  if (!sourceItems.length) return;

  // Write into destination discussion table
  if (destType === 'forum_thread') {
    for (const item of sourceItems) {
      await db
        .prepare(
          'INSERT INTO forum_replies (id, thread_id, author_user_id, body, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(crypto.randomUUID(), destId, item.author_user_id, item.body, item.created_at, null, 0)
        .run();
    }
    return;
  }

  if (destType === 'project') {
    for (const item of sourceItems) {
      await db
        .prepare(
          'INSERT INTO project_comments (id, project_id, author_user_id, body, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(crypto.randomUUID(), destId, item.author_user_id, item.body, item.created_at, null, 0)
        .run();
    }
    return;
  }

  if (destType === 'music_post') {
    for (const item of sourceItems) {
      await db
        .prepare(
          'INSERT INTO music_comments (id, post_id, author_user_id, body, created_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .bind(crypto.randomUUID(), destId, item.author_user_id, item.body, item.created_at, 0)
        .run();
    }
    return;
  }

  if (destType === 'timeline_update') {
    for (const item of sourceItems) {
      await db
        .prepare(
          'INSERT INTO timeline_comments (id, update_id, author_user_id, body, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(crypto.randomUUID(), destId, item.author_user_id, item.body, item.created_at, null, 0)
        .run();
    }
    return;
  }

  if (destType === 'dev_log') {
    for (const item of sourceItems) {
      await db
        .prepare(
          'INSERT INTO dev_log_comments (id, log_id, author_user_id, body, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(crypto.randomUUID(), destId, item.author_user_id, item.body, item.created_at, null, 0)
        .run();
    }
    return;
  }

  if (destType === 'event') {
    for (const item of sourceItems) {
      await db
        .prepare(
          'INSERT INTO event_comments (id, event_id, author_user_id, body, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(crypto.randomUUID(), destId, item.author_user_id, item.body, item.created_at, null, 0)
        .run();
    }
  }
}

async function createDestination(db, { destType, sourceType, source, extra }) {
  const now = Date.now();
  const id = crypto.randomUUID();

  if (destType === 'project') {
    const title = source.title || '(untitled)';
    const description =
      sourceType === 'project'
        ? source.description
        : sourceType === 'event'
        ? source.details || ''
        : source.body || '';
    const status = String(extra.status || 'active').trim() || 'active';
    await db
      .prepare(
        'INSERT INTO projects (id, author_user_id, title, description, status, github_url, demo_url, image_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, source.author_user_id, title, description, status, null, null, source.image_key || null, now, null)
      .run();
    return id;
  }

  if (destType === 'forum_thread') {
    const title = source.title || '(untitled)';
    const body =
      sourceType === 'project'
        ? source.description
        : sourceType === 'event'
        ? source.details || ''
        : sourceType === 'music_post'
        ? `Source: ${source.url}\n\n${source.body || ''}`.trim()
        : source.body || '';
    await db
      .prepare(
        'INSERT INTO forum_threads (id, author_user_id, title, body, created_at, updated_at, is_locked, is_pinned, image_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, source.author_user_id, title, body, now, null, 0, 0, source.image_key || null)
      .run();
    return id;
  }

  if (destType === 'timeline_update') {
    const title = source.title || null;
    const body =
      sourceType === 'project'
        ? source.description
        : sourceType === 'event'
        ? source.details || ''
        : sourceType === 'music_post'
        ? `Source: ${source.url}\n\n${source.body || ''}`.trim()
        : source.body || '';
    await db
      .prepare(
        'INSERT INTO timeline_updates (id, author_user_id, title, body, created_at, updated_at, is_pinned, image_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, source.author_user_id, title, body, now, null, 0, source.image_key || null)
      .run();
    return id;
  }

  if (destType === 'event') {
    const title = source.title || '(untitled)';
    const details =
      sourceType === 'project'
        ? source.description
        : sourceType === 'music_post'
        ? `Source: ${source.url}\n\n${source.body || ''}`.trim()
        : source.body || source.details || null;
    const startsAt = Date.parse(String(extra.starts_at || ''));
    if (Number.isNaN(startsAt)) {
      throw new Error('events_requires_starts_at');
    }
    await db
      .prepare(
        'INSERT INTO events (id, author_user_id, title, details, starts_at, created_at, image_key) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, source.author_user_id, title, details || null, startsAt, now, source.image_key || null)
      .run();
    return id;
  }

  if (destType === 'music_post') {
    const title = source.title || '(untitled)';
    const url = String(extra.url || '').trim();
    const type = String(extra.type || '').trim();
    if (!url || !type) {
      throw new Error('music_requires_url_type');
    }
    const body =
      sourceType === 'project'
        ? source.description
        : sourceType === 'event'
        ? source.details || ''
        : source.body || '';
    const tags = String(extra.tags || '').trim() || null;
    await db
      .prepare(
        'INSERT INTO music_posts (id, author_user_id, title, body, url, type, tags, image_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, source.author_user_id, title, body || null, url, type, tags, source.image_key || null, now)
      .run();
    return id;
  }

  if (destType === 'dev_log') {
    const title = source.title || '(untitled)';
    const body =
      sourceType === 'project'
        ? source.description
        : sourceType === 'event'
        ? source.details || ''
        : sourceType === 'music_post'
        ? `Source: ${source.url}\n\n${source.body || ''}`.trim()
        : source.body || '';
    await db
      .prepare(
        'INSERT INTO dev_logs (id, author_user_id, title, body, image_key, created_at, updated_at, is_locked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, source.author_user_id, title, body, source.image_key || null, now, null, 0)
      .run();
    return id;
  }

  throw new Error('unsupported_dest');
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const sourceUrl = String(formData.get('source_url') || '').trim();
  const sourceTypeRaw = String(formData.get('source_type') || '').trim();
  const sourceIdRaw = String(formData.get('source_id') || '').trim();
  const destType = normalizeType(formData.get('dest_type'));

  const parsed = sourceUrl ? parseSource(sourceUrl) : null;
  const sourceType = parsed?.type || normalizeType(sourceTypeRaw);
  const sourceId = parsed?.id || sourceIdRaw;

  if (!sourceType || !sourceId || !destType) {
    return NextResponse.json({ error: 'Missing source/destination' }, { status: 400 });
  }

  const db = await getDb();

  // Ensure move system tables/columns exist (migrations applied).
  try {
    await db.prepare('SELECT 1 FROM content_moves LIMIT 1').first();
  } catch (e) {
    return NextResponse.json(
      {
        error: 'move_system_not_migrated',
        detail:
          'Move system database tables are not available yet. Apply migrations/0012_move_system.sql to D1, then retry.'
      },
      { status: 400 }
    );
  }

  // If already moved, redirect to canonical destination.
  const existingMove = await getMoveTarget(db, sourceType, sourceId);
  if (existingMove) {
    const to = destPathFor(existingMove.type, existingMove.id);
    return NextResponse.redirect(new URL(to || '/', request.url), 303);
  }

  const source = await fetchSource(db, sourceType, sourceId);
  if (!source?.id) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  // Prevent moving already-marked sources (even if moves table isn't present yet in local dev).
  if (source.moved_to_id) {
    const to = destPathFor(source.moved_to_type, source.moved_to_id);
    return NextResponse.redirect(new URL(to || '/', request.url), 303);
  }

  const extra = {
    starts_at: formData.get('starts_at'),
    url: formData.get('url'),
    type: formData.get('type'),
    tags: formData.get('tags'),
    status: formData.get('status'),
  };

  let destId;
  try {
    destId = await createDestination(db, { destType, sourceType, source, extra });
  } catch (e) {
    const msg = String(e?.message || e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await migrateDiscussion(db, { sourceType, sourceId, destType, destId });

  await markMoved(db, {
    sourceType,
    sourceId,
    destType,
    destId,
    movedByUserId: user.id,
    movedAt: Date.now(),
  });

  const to = destPathFor(destType, destId);
  return NextResponse.redirect(new URL(to || '/', request.url), 303);
}

