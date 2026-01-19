import ClaimUsernameForm from '../components/ClaimUsernameForm';
import { getSessionUser } from '../lib/auth';
import { getDb } from '../lib/db';

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

export default async function HomePage() {
  const user = await getSessionUser();
  const hasUsername = !!user;

  // Fetch section data for logged-in users
  let sectionData = null;
  if (hasUsername) {
    const db = await getDb();

    // Timeline/Announcements
    const timelineCount = await db.prepare('SELECT COUNT(*) as count FROM timeline_updates').first();
    const timelineRecent = await db
      .prepare(
        `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.created_at,
                users.username AS author_name
         FROM timeline_updates
         JOIN users ON users.id = timeline_updates.author_user_id
         ORDER BY timeline_updates.created_at DESC
         LIMIT 1`
      )
      .first();

    // Forum/General
    const forumCount = await db.prepare('SELECT COUNT(*) as count FROM forum_threads').first();
    const forumRecent = await db
      .prepare(
        `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
                users.username AS author_name
         FROM forum_threads
         JOIN users ON users.id = forum_threads.author_user_id
         ORDER BY forum_threads.created_at DESC
         LIMIT 1`
      )
      .first();

    // Events
    const eventsCount = await db.prepare('SELECT COUNT(*) as count FROM events').first();
    const eventsRecent = await db
      .prepare(
        `SELECT events.id, events.title, events.created_at,
                users.username AS author_name
         FROM events
         JOIN users ON users.id = events.author_user_id
         ORDER BY events.created_at DESC
         LIMIT 1`
      )
      .first();

    // Music
    const musicCount = await db.prepare('SELECT COUNT(*) as count FROM music_posts').first();
    const musicRecent = await db
      .prepare(
        `SELECT music_posts.id, music_posts.title, music_posts.created_at,
                users.username AS author_name
         FROM music_posts
         JOIN users ON users.id = music_posts.author_user_id
         ORDER BY music_posts.created_at DESC
         LIMIT 1`
      )
      .first();

    // Projects
    const projectsCount = await db.prepare('SELECT COUNT(*) as count FROM projects').first();
    const projectsRecent = await db
      .prepare(
        `SELECT projects.id, projects.title, projects.created_at,
                users.username AS author_name
         FROM projects
         JOIN users ON users.id = projects.author_user_id
         ORDER BY projects.created_at DESC
         LIMIT 1`
      )
      .first();

    // Shitposts
    const shitpostsCount = await db
      .prepare('SELECT COUNT(*) as count FROM forum_threads WHERE image_key IS NOT NULL')
      .first();
    const shitpostsRecent = await db
      .prepare(
        `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
                users.username AS author_name
         FROM forum_threads
         JOIN users ON users.id = forum_threads.author_user_id
         WHERE forum_threads.image_key IS NOT NULL
         ORDER BY forum_threads.created_at DESC
         LIMIT 1`
      )
      .first();

    sectionData = {
      timeline: {
        count: timelineCount?.count || 0,
        recent: timelineRecent
          ? {
              id: timelineRecent.id,
              title: timelineRecent.title,
              author: timelineRecent.author_name,
              timeAgo: formatTimeAgo(timelineRecent.created_at),
              url: `/timeline`
            }
          : null
      },
      forum: {
        count: forumCount?.count || 0,
        recent: forumRecent
          ? {
              id: forumRecent.id,
              title: forumRecent.title,
              author: forumRecent.author_name,
              timeAgo: formatTimeAgo(forumRecent.created_at),
              url: `/forum/${forumRecent.id}`
            }
          : null
      },
      events: {
        count: eventsCount?.count || 0,
        recent: eventsRecent
          ? {
              id: eventsRecent.id,
              title: eventsRecent.title,
              author: eventsRecent.author_name,
              timeAgo: formatTimeAgo(eventsRecent.created_at),
              url: `/events`
            }
          : null
      },
      music: {
        count: musicCount?.count || 0,
        recent: musicRecent
          ? {
              id: musicRecent.id,
              title: musicRecent.title,
              author: musicRecent.author_name,
              timeAgo: formatTimeAgo(musicRecent.created_at),
              url: `/music/${musicRecent.id}`
            }
          : null
      },
      projects: {
        count: projectsCount?.count || 0,
        recent: projectsRecent
          ? {
              id: projectsRecent.id,
              title: projectsRecent.title,
              author: projectsRecent.author_name,
              timeAgo: formatTimeAgo(projectsRecent.created_at),
              url: `/projects/${projectsRecent.id}`
            }
          : null
      },
      shitposts: {
        count: shitpostsCount?.count || 0,
        recent: shitpostsRecent
          ? {
              id: shitpostsRecent.id,
              title: shitpostsRecent.title,
              author: shitpostsRecent.author_name,
              timeAgo: formatTimeAgo(shitpostsRecent.created_at),
              url: `/forum/${shitpostsRecent.id}`
            }
          : null
      }
    };
  }

  return (
    <div className="stack">
      {!hasUsername && (
        <>
          <section className="card">
            <h2 className="section-title">Welcome</h2>
            <p className="muted">
              This is the public spot to share ideas, post announcements, and plan meetups. Reading is open to everyone. Posting requires claiming a username once per browser.
            </p>
          </section>
          <section className="card split">
            <div>
              <h3 className="section-title">Claim your username</h3>
              <p className="muted">
                Usernames are one per person. Once claimed, the browser gets a private session token
                so no one else can take that name unless the admin resets the system.
              </p>
            </div>
            <ClaimUsernameForm />
          </section>
        </>
      )}

      {hasUsername && (
        <section className="card">
          <h2 className="section-title">Welcome back</h2>
          <p className="muted" style={{ marginBottom: '20px' }}>
            Check out all the new posts in
          </p>
          <div className="list grid-tiles">
              <a href="/timeline" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Announcements</strong>
                <div className="list-meta">Official updates, pinned notes, releases.</div>
                {sectionData && (
                  <div className="section-stats">
                    {sectionData.timeline.count > 0 ? (
                      <>
                        <span>{sectionData.timeline.count} {sectionData.timeline.count === 1 ? 'post' : 'posts'}</span>
                        {sectionData.timeline.recent && (
                          <span>
                            {' · '}
                            Latest:{' '}
                            <a
                              href={sectionData.timeline.recent.url}
                              style={{ color: 'var(--errl-accent-3)', textDecoration: 'none' }}
                            >
                              {sectionData.timeline.recent.title}
                            </a>
                            {' by '}
                            {sectionData.timeline.recent.author} {sectionData.timeline.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>No posts yet</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/forum" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>General</strong>
                <div className="list-meta">Post whatever you want - general discussion and conversations.</div>
                {sectionData && (
                  <div className="section-stats">
                    {sectionData.forum.count > 0 ? (
                      <>
                        <span>{sectionData.forum.count} {sectionData.forum.count === 1 ? 'post' : 'posts'}</span>
                        {sectionData.forum.recent && (
                          <span>
                            {' · '}
                            Latest:{' '}
                            <a
                              href={sectionData.forum.recent.url}
                              style={{ color: 'var(--errl-accent-3)', textDecoration: 'none' }}
                            >
                              {sectionData.forum.recent.title}
                            </a>
                            {' by '}
                            {sectionData.forum.recent.author} {sectionData.forum.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>No posts yet</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/events" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Events</strong>
                <div className="list-meta">Lightweight calendar entries for plans.</div>
                {sectionData && (
                  <div className="section-stats">
                    {sectionData.events.count > 0 ? (
                      <>
                        <span>{sectionData.events.count} {sectionData.events.count === 1 ? 'post' : 'posts'}</span>
                        {sectionData.events.recent && (
                          <span>
                            {' · '}
                            Latest:{' '}
                            <a
                              href={sectionData.events.recent.url}
                              style={{ color: 'var(--errl-accent-3)', textDecoration: 'none' }}
                            >
                              {sectionData.events.recent.title}
                            </a>
                            {' by '}
                            {sectionData.events.recent.author} {sectionData.events.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>No posts yet</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/music" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Music</strong>
                <div className="list-meta">Share tracks, rate them, and leave notes.</div>
                {sectionData && (
                  <div className="section-stats">
                    {sectionData.music.count > 0 ? (
                      <>
                        <span>{sectionData.music.count} {sectionData.music.count === 1 ? 'post' : 'posts'}</span>
                        {sectionData.music.recent && (
                          <span>
                            {' · '}
                            Latest:{' '}
                            <a
                              href={sectionData.music.recent.url}
                              style={{ color: 'var(--errl-accent-3)', textDecoration: 'none' }}
                            >
                              {sectionData.music.recent.title}
                            </a>
                            {' by '}
                            {sectionData.music.recent.author} {sectionData.music.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>No posts yet</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/projects" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Projects</strong>
                <div className="list-meta">Work in progress and project updates.</div>
                {sectionData && (
                  <div className="section-stats">
                    {sectionData.projects.count > 0 ? (
                      <>
                        <span>{sectionData.projects.count} {sectionData.projects.count === 1 ? 'post' : 'posts'}</span>
                        {sectionData.projects.recent && (
                          <span>
                            {' · '}
                            Latest:{' '}
                            <a
                              href={sectionData.projects.recent.url}
                              style={{ color: 'var(--errl-accent-3)', textDecoration: 'none' }}
                            >
                              {sectionData.projects.recent.title}
                            </a>
                            {' by '}
                            {sectionData.projects.recent.author} {sectionData.projects.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>No posts yet</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/shitposts" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Shitposts</strong>
                <div className="list-meta">Post whatever you want - photos, memes, random thoughts.</div>
                {sectionData && (
                  <div className="section-stats">
                    {sectionData.shitposts.count > 0 ? (
                      <>
                        <span>{sectionData.shitposts.count} {sectionData.shitposts.count === 1 ? 'post' : 'posts'}</span>
                        {sectionData.shitposts.recent && (
                          <span>
                            {' · '}
                            Latest:{' '}
                            <a
                              href={sectionData.shitposts.recent.url}
                              style={{ color: 'var(--errl-accent-3)', textDecoration: 'none' }}
                            >
                              {sectionData.shitposts.recent.title}
                            </a>
                            {' by '}
                            {sectionData.shitposts.recent.author} {sectionData.shitposts.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>No posts yet</span>
                    )}
                  </div>
                )}
              </a>
          </div>
        </section>
      )}
    </div>
  );
}
