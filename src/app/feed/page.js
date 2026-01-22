import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import Breadcrumbs from '../../components/Breadcrumbs';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  return 'just now';
}

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
              users.username AS author_name
       FROM timeline_updates
       JOIN users ON users.id = timeline_updates.author_user_id
       WHERE timeline_updates.moved_to_id IS NULL
       ORDER BY timeline_updates.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.created_at,
              users.username AS author_name
       FROM timeline_updates
       JOIN users ON users.id = timeline_updates.author_user_id
       ORDER BY timeline_updates.created_at DESC
       LIMIT ${limitPerType}`,
      []
    ),
    safeAll(
      db,
      `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
              users.username AS author_name
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       WHERE forum_threads.moved_to_id IS NULL
       ORDER BY forum_threads.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
              users.username AS author_name
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       ORDER BY forum_threads.created_at DESC
       LIMIT ${limitPerType}`,
      []
    ),
    safeAll(
      db,
      `SELECT events.id, events.title, events.created_at, events.starts_at,
              users.username AS author_name
       FROM events
       JOIN users ON users.id = events.author_user_id
       WHERE events.moved_to_id IS NULL
       ORDER BY events.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT events.id, events.title, events.created_at, events.starts_at,
              users.username AS author_name
       FROM events
       JOIN users ON users.id = events.author_user_id
       ORDER BY events.created_at DESC
       LIMIT ${limitPerType}`,
      []
    ),
    safeAll(
      db,
      `SELECT music_posts.id, music_posts.title, music_posts.created_at,
              users.username AS author_name
       FROM music_posts
       JOIN users ON users.id = music_posts.author_user_id
       WHERE music_posts.moved_to_id IS NULL
       ORDER BY music_posts.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT music_posts.id, music_posts.title, music_posts.created_at,
              users.username AS author_name
       FROM music_posts
       JOIN users ON users.id = music_posts.author_user_id
       ORDER BY music_posts.created_at DESC
       LIMIT ${limitPerType}`,
      []
    ),
    safeAll(
      db,
      `SELECT projects.id, projects.title, projects.created_at,
              users.username AS author_name
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       WHERE projects.moved_to_id IS NULL
       ORDER BY projects.created_at DESC
       LIMIT ${limitPerType}`,
      [],
      `SELECT projects.id, projects.title, projects.created_at,
              users.username AS author_name
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
                  users.username AS author_name
           FROM posts
           JOIN users ON users.id = posts.author_user_id
           WHERE posts.type IN ('art','bugs','rant','nostalgia','lore','memories')
             AND (${isSignedIn ? '1=1' : "posts.is_private = 0 AND posts.type NOT IN ('lore','memories')"})
           ORDER BY posts.created_at DESC
           LIMIT ${limitPerType}`,
          [],
          `SELECT posts.id, posts.type, posts.title, posts.created_at, posts.is_private,
                  users.username AS author_name
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
                  users.username AS author_name
           FROM dev_logs
           JOIN users ON users.id = dev_logs.author_user_id
           ORDER BY dev_logs.created_at DESC
           LIMIT ${limitPerType}`,
          [],
          `SELECT dev_logs.id, dev_logs.title, dev_logs.created_at,
                  users.username AS author_name
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
      meta: null
    })),
    ...threads.map((row) => ({
      type: 'Lobby',
      href: `/lobby/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      meta: null
    })),
    ...events.map((row) => ({
      type: 'Event',
      href: `/events/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      meta: row.starts_at ? `Starts ${new Date(row.starts_at).toLocaleString()}` : null
    })),
    ...music.map((row) => ({
      type: 'Music',
      href: `/music/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      meta: null
    })),
    ...projects.map((row) => ({
      type: 'Project',
      href: `/projects/${row.id}`,
      createdAt: row.created_at,
      title: row.title,
      author: row.author_name,
      meta: null
    })),
    ...posts.map((row) => ({
      type: labelForPostType(row.type),
      href: `/${row.type}/${row.id}`,
      createdAt: row.created_at,
      title: row.title || 'Untitled',
      author: row.author_name,
      meta: row.is_private ? 'Members-only' : null
    })),
    ...devlogs.map((row) => ({
      type: 'Development',
      href: `/devlog/${row.id}`,
      createdAt: row.created_at,
      title: row.title || 'Development update',
      author: row.author_name,
      meta: null
    }))
  ]
    .filter((x) => !!x.createdAt)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

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
            items.map((item) => (
              <a
                key={`${item.type}:${item.href}`}
                href={item.href}
                className="list-item"
                style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
              >
                <div className="post-header">
                  <h3 style={{ margin: 0 }}>{item.title}</h3>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginTop: '8px',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      posted by: <Username name={item.author} colorIndex={getUsernameColorIndex(item.author)} />
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <span className="muted" style={{ fontSize: 12 }}>{item.type}</span>
                    {item.type === 'Event' && item.meta ? (
                      <span style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'right' }}>
                        {item.meta}
                      </span>
                    ) : null}
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

