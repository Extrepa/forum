import ClaimUsernameForm from '../components/ClaimUsernameForm';
import { redirect } from 'next/navigation';
import { getSessionUser } from '../lib/auth';
import { getDb } from '../lib/db';
import Username from '../components/Username';
import { getUsernameColorIndex } from '../lib/usernameColor';
import {
  getForumStrings,
  getTimeBasedGreetingTemplate,
  renderTemplateParts
} from '../lib/forum-texts';

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
  
  // Check landing page preference and redirect if set to 'feed'
  if (hasUsername) {
    const landingPage = user.default_landing_page || 'home';
    if (landingPage === 'feed') {
      redirect('/feed');
    }
  }
  
  const envLore = process.env.NEXT_PUBLIC_ERRL_USE_LORE === 'true';
  const useLore = !!user?.ui_lore_enabled || envLore;
  const strings = getForumStrings({ useLore });

  const safeFirst = async (db, primarySql, primaryBinds, fallbackSql, fallbackBinds) => {
    try {
      const stmt = db.prepare(primarySql);
      const bound = primaryBinds?.length ? stmt.bind(...primaryBinds) : stmt;
      return await bound.first();
    } catch (e) {
      const stmt = db.prepare(fallbackSql);
      const bound = fallbackBinds?.length ? stmt.bind(...fallbackBinds) : stmt;
      return await bound.first();
    }
  };

  // Fetch section data for logged-in users
  let sectionData = null;
  if (hasUsername) {
    const db = await getDb();

    // Timeline/Announcements
    const timelineCount = await safeFirst(
      db,
      'SELECT COUNT(*) as count FROM timeline_updates WHERE moved_to_id IS NULL',
      [],
      'SELECT COUNT(*) as count FROM timeline_updates',
      []
    );
    const timelineRecent = await safeFirst(
      db,
      `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.created_at,
              users.username AS author_name
       FROM timeline_updates
       JOIN users ON users.id = timeline_updates.author_user_id
       WHERE timeline_updates.moved_to_id IS NULL
       ORDER BY timeline_updates.created_at DESC
       LIMIT 1`,
      [],
      `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.created_at,
              users.username AS author_name
       FROM timeline_updates
       JOIN users ON users.id = timeline_updates.author_user_id
       ORDER BY timeline_updates.created_at DESC
       LIMIT 1`,
      []
    );

    // Forum/General
    const forumCount = await safeFirst(
      db,
      'SELECT COUNT(*) as count FROM forum_threads WHERE moved_to_id IS NULL',
      [],
      'SELECT COUNT(*) as count FROM forum_threads',
      []
    );
    const forumRecent = await safeFirst(
      db,
      `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
              users.username AS author_name
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       WHERE forum_threads.moved_to_id IS NULL
       ORDER BY forum_threads.created_at DESC
       LIMIT 1`,
      [],
      `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
              users.username AS author_name
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       ORDER BY forum_threads.created_at DESC
       LIMIT 1`,
      []
    );

    // Events
    const eventsCount = await safeFirst(
      db,
      'SELECT COUNT(*) as count FROM events WHERE moved_to_id IS NULL',
      [],
      'SELECT COUNT(*) as count FROM events',
      []
    );
    const eventsRecent = await safeFirst(
      db,
      `SELECT events.id, events.title, events.created_at,
              users.username AS author_name
       FROM events
       JOIN users ON users.id = events.author_user_id
       WHERE events.moved_to_id IS NULL
       ORDER BY events.created_at DESC
       LIMIT 1`,
      [],
      `SELECT events.id, events.title, events.created_at,
              users.username AS author_name
       FROM events
       JOIN users ON users.id = events.author_user_id
       ORDER BY events.created_at DESC
       LIMIT 1`,
      []
    );

    // Music
    const musicCount = await safeFirst(
      db,
      'SELECT COUNT(*) as count FROM music_posts WHERE moved_to_id IS NULL',
      [],
      'SELECT COUNT(*) as count FROM music_posts',
      []
    );
    const musicRecent = await safeFirst(
      db,
      `SELECT music_posts.id, music_posts.title, music_posts.created_at,
              users.username AS author_name
       FROM music_posts
       JOIN users ON users.id = music_posts.author_user_id
       WHERE music_posts.moved_to_id IS NULL
       ORDER BY music_posts.created_at DESC
       LIMIT 1`,
      [],
      `SELECT music_posts.id, music_posts.title, music_posts.created_at,
              users.username AS author_name
       FROM music_posts
       JOIN users ON users.id = music_posts.author_user_id
       ORDER BY music_posts.created_at DESC
       LIMIT 1`,
      []
    );

    // Projects
    const projectsCount = await safeFirst(
      db,
      'SELECT COUNT(*) as count FROM projects WHERE moved_to_id IS NULL',
      [],
      'SELECT COUNT(*) as count FROM projects',
      []
    );
    const projectsRecent = await safeFirst(
      db,
      `SELECT projects.id, projects.title, projects.created_at,
              users.username AS author_name
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       WHERE projects.moved_to_id IS NULL
       ORDER BY projects.created_at DESC
       LIMIT 1`,
      [],
      `SELECT projects.id, projects.title, projects.created_at,
              users.username AS author_name
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       ORDER BY projects.created_at DESC
       LIMIT 1`,
      []
    );

    // Shitposts
    const shitpostsCount = await safeFirst(
      db,
      'SELECT COUNT(*) as count FROM forum_threads WHERE image_key IS NOT NULL AND moved_to_id IS NULL',
      [],
      'SELECT COUNT(*) as count FROM forum_threads WHERE image_key IS NOT NULL',
      []
    );
    const shitpostsRecent = await safeFirst(
      db,
      `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
              users.username AS author_name
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       WHERE forum_threads.image_key IS NOT NULL
         AND forum_threads.moved_to_id IS NULL
       ORDER BY forum_threads.created_at DESC
       LIMIT 1`,
      [],
      `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
              users.username AS author_name
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       WHERE forum_threads.image_key IS NOT NULL
       ORDER BY forum_threads.created_at DESC
       LIMIT 1`,
      []
    );

    // Art & Nostalgia (combined)
    const artNostalgiaCount = await safeFirst(
      db,
      `SELECT COUNT(*) as count FROM posts WHERE type IN ('art', 'nostalgia') AND (${hasUsername ? '1=1' : 'is_private = 0'})`,
      [],
      'SELECT COUNT(*) as count FROM posts WHERE type IN (\'art\', \'nostalgia\')',
      []
    );
    const artNostalgiaRecent = await safeFirst(
      db,
      `SELECT posts.id, posts.title, posts.created_at, posts.type,
              users.username AS author_name
       FROM posts
       JOIN users ON users.id = posts.author_user_id
       WHERE posts.type IN ('art', 'nostalgia')
         AND (${hasUsername ? '1=1' : 'posts.is_private = 0'})
       ORDER BY posts.created_at DESC
       LIMIT 1`,
      [],
      `SELECT posts.id, posts.title, posts.created_at, posts.type,
              users.username AS author_name
       FROM posts
       JOIN users ON users.id = posts.author_user_id
       WHERE posts.type IN ('art', 'nostalgia')
       ORDER BY posts.created_at DESC
       LIMIT 1`,
      []
    );

    // Bugs & Rants (combined)
    const bugsRantCount = await safeFirst(
      db,
      `SELECT COUNT(*) as count FROM posts WHERE type IN ('bugs', 'rant') AND (${hasUsername ? '1=1' : 'is_private = 0'})`,
      [],
      'SELECT COUNT(*) as count FROM posts WHERE type IN (\'bugs\', \'rant\')',
      []
    );
    const bugsRantRecent = await safeFirst(
      db,
      `SELECT posts.id, posts.title, posts.created_at, posts.type,
              users.username AS author_name
       FROM posts
       JOIN users ON users.id = posts.author_user_id
       WHERE posts.type IN ('bugs', 'rant')
         AND (${hasUsername ? '1=1' : 'posts.is_private = 0'})
       ORDER BY posts.created_at DESC
       LIMIT 1`,
      [],
      `SELECT posts.id, posts.title, posts.created_at, posts.type,
              users.username AS author_name
       FROM posts
       JOIN users ON users.id = posts.author_user_id
       WHERE posts.type IN ('bugs', 'rant')
       ORDER BY posts.created_at DESC
       LIMIT 1`,
      []
    );

    // Development (signed-in only)
    let devlogCount = null;
    let devlogRecent = null;
    if (hasUsername) {
      try {
        devlogCount = await safeFirst(
          db,
          'SELECT COUNT(*) as count FROM dev_logs',
          [],
          'SELECT COUNT(*) as count FROM dev_logs',
          []
        );
        devlogRecent = await safeFirst(
          db,
          `SELECT dev_logs.id, dev_logs.title, dev_logs.created_at,
                  users.username AS author_name
           FROM dev_logs
           JOIN users ON users.id = dev_logs.author_user_id
           ORDER BY dev_logs.created_at DESC
           LIMIT 1`,
          [],
          `SELECT dev_logs.id, dev_logs.title, dev_logs.created_at,
                  users.username AS author_name
           FROM dev_logs
           JOIN users ON users.id = dev_logs.author_user_id
           ORDER BY dev_logs.created_at DESC
           LIMIT 1`,
          []
        );
      } catch (e) {
        // Dev logs table might not exist
      }
    }

    // Lore & Memories (signed-in only, combined)
    let loreMemoriesCount = null;
    let loreMemoriesRecent = null;
    if (hasUsername) {
      try {
        loreMemoriesCount = await safeFirst(
          db,
          'SELECT COUNT(*) as count FROM posts WHERE type IN (\'lore\', \'memories\')',
          [],
          'SELECT COUNT(*) as count FROM posts WHERE type IN (\'lore\', \'memories\')',
          []
        );
        loreMemoriesRecent = await safeFirst(
          db,
          `SELECT posts.id, posts.title, posts.created_at, posts.type,
                  users.username AS author_name
           FROM posts
           JOIN users ON users.id = posts.author_user_id
           WHERE posts.type IN ('lore', 'memories')
           ORDER BY posts.created_at DESC
           LIMIT 1`,
          [],
          `SELECT posts.id, posts.title, posts.created_at, posts.type,
                  users.username AS author_name
           FROM posts
           JOIN users ON users.id = posts.author_user_id
           WHERE posts.type IN ('lore', 'memories')
           ORDER BY posts.created_at DESC
           LIMIT 1`,
          []
        );
      } catch (e) {
        // Posts table might not exist
      }
    }

    sectionData = {
      timeline: {
        count: timelineCount?.count || 0,
        recent: timelineRecent
          ? {
              id: timelineRecent.id,
              title: timelineRecent.title,
              author: timelineRecent.author_name,
              timeAgo: formatTimeAgo(timelineRecent.created_at),
              url: `/announcements/${timelineRecent.id}`
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
              url: `/lobby/${forumRecent.id}`
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
              url: `/events/${eventsRecent.id}`
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
              url: `/lobby/${shitpostsRecent.id}`
            }
          : null
      },
      artNostalgia: {
        count: artNostalgiaCount?.count || 0,
        recent: artNostalgiaRecent
          ? {
              id: artNostalgiaRecent.id,
              title: artNostalgiaRecent.title || 'Untitled',
              author: artNostalgiaRecent.author_name,
              timeAgo: formatTimeAgo(artNostalgiaRecent.created_at),
              url: `/${artNostalgiaRecent.type}/${artNostalgiaRecent.id}`
            }
          : null
      },
      bugsRant: {
        count: bugsRantCount?.count || 0,
        recent: bugsRantRecent
          ? {
              id: bugsRantRecent.id,
              title: bugsRantRecent.title || (bugsRantRecent.type === 'bugs' ? 'Bug report' : 'Untitled'),
              author: bugsRantRecent.author_name,
              timeAgo: formatTimeAgo(bugsRantRecent.created_at),
              url: `/${bugsRantRecent.type}/${bugsRantRecent.id}`
            }
          : null
      },
      devlog: hasUsername && devlogCount !== null ? {
        count: devlogCount?.count || 0,
        recent: devlogRecent
          ? {
              id: devlogRecent.id,
              title: devlogRecent.title,
              author: devlogRecent.author_name,
              timeAgo: formatTimeAgo(devlogRecent.created_at),
              url: `/devlog/${devlogRecent.id}`
            }
          : null
      } : null,
      loreMemories: hasUsername && loreMemoriesCount !== null ? {
        count: loreMemoriesCount?.count || 0,
        recent: loreMemoriesRecent
          ? {
              id: loreMemoriesRecent.id,
              title: loreMemoriesRecent.title || 'Untitled',
              author: loreMemoriesRecent.author_name,
              timeAgo: formatTimeAgo(loreMemoriesRecent.created_at),
              url: `/lore-memories/${loreMemoriesRecent.id}`
            }
          : null
      } : null
    };
  }

  return (
    <div className="stack">
      {!hasUsername && (
        <>
          <section className="card">
            <h2 className="section-title">Welcome</h2>
            <p className="muted">
              This is the public spot to share ideas, post announcements, and plan meetups. Reading is open to everyone.
              Posting requires an account so you can sign in from any device.
            </p>
          </section>
          <section className="card split">
            <div>
              <h3 className="section-title">Sign in</h3>
              <p className="muted">
                New users: Create an account with email, username, and password to post from any device.
                Legacy users: Sign in with your existing username and password, then add an email to your account.
              </p>
            </div>
            <ClaimUsernameForm />
          </section>
        </>
      )}

      {hasUsername && (
        <section className="card">
          {(() => {
            const { template } = getTimeBasedGreetingTemplate({ date: new Date(), useLore });
            const parts = renderTemplateParts(template, 'username');

            return (
              <h2 className="section-title">
                {parts.hasVar ? (
                  <>
                    {parts.before}
                    {user?.username ? <Username name={user.username} force="purple" /> : 'friend'}
                    {parts.after}
                  </>
                ) : (
                  parts.before
                )}
              </h2>
            );
          })()}
          <p className="muted" style={{ marginBottom: '20px' }}>
            {strings.hero.subline}
          </p>
          <div className="list grid-tiles">
              <a href="/announcements" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>{strings.cards.announcements.title}</strong>
                <div className="list-meta">{strings.cards.announcements.description}</div>
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
                            <Username
                              name={sectionData.timeline.recent.author}
                              colorIndex={getUsernameColorIndex(sectionData.timeline.recent.author)}
                            />{' '}
                            {sectionData.timeline.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{strings.cards.announcements.empty}</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/lobby" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>{strings.cards.general.title}</strong>
                <div className="list-meta">{strings.cards.general.description}</div>
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
                            <Username
                              name={sectionData.forum.recent.author}
                              colorIndex={getUsernameColorIndex(sectionData.forum.recent.author)}
                            />{' '}
                            {sectionData.forum.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{strings.cards.general.empty}</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/events" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>{strings.cards.events.title}</strong>
                <div className="list-meta">{strings.cards.events.description}</div>
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
                            <Username
                              name={sectionData.events.recent.author}
                              colorIndex={getUsernameColorIndex(sectionData.events.recent.author)}
                            />{' '}
                            {sectionData.events.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{strings.cards.events.empty}</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/music" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>{strings.cards.music.title}</strong>
                <div className="list-meta">{strings.cards.music.description}</div>
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
                            <Username
                              name={sectionData.music.recent.author}
                              colorIndex={getUsernameColorIndex(sectionData.music.recent.author)}
                            />{' '}
                            {sectionData.music.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{strings.cards.music.empty}</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/projects" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>{strings.cards.projects.title}</strong>
                <div className="list-meta">{strings.cards.projects.description}</div>
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
                            <Username
                              name={sectionData.projects.recent.author}
                              colorIndex={getUsernameColorIndex(sectionData.projects.recent.author)}
                            />{' '}
                            {sectionData.projects.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{strings.cards.projects.empty}</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/shitposts" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>{strings.cards.shitposts.title}</strong>
                <div className="list-meta">{strings.cards.shitposts.description}</div>
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
                            <Username
                              name={sectionData.shitposts.recent.author}
                              colorIndex={getUsernameColorIndex(sectionData.shitposts.recent.author)}
                            />{' '}
                            {sectionData.shitposts.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{strings.cards.shitposts.empty}</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/art-nostalgia" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>{strings.cards.artNostalgia.title}</strong>
                <div className="list-meta">{strings.cards.artNostalgia.description}</div>
                {sectionData && sectionData.artNostalgia && (
                  <div className="section-stats">
                    {sectionData.artNostalgia.count > 0 ? (
                      <>
                        <span>{sectionData.artNostalgia.count} {sectionData.artNostalgia.count === 1 ? 'post' : 'posts'}</span>
                        {sectionData.artNostalgia.recent && (
                          <span>
                            {' · '}
                            Latest:{' '}
                            <a
                              href={sectionData.artNostalgia.recent.url}
                              style={{ color: 'var(--errl-accent-3)', textDecoration: 'none' }}
                            >
                              {sectionData.artNostalgia.recent.title}
                            </a>
                            {' by '}
                            <Username
                              name={sectionData.artNostalgia.recent.author}
                              colorIndex={getUsernameColorIndex(sectionData.artNostalgia.recent.author)}
                            />{' '}
                            {sectionData.artNostalgia.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{strings.cards.artNostalgia.empty}</span>
                    )}
                  </div>
                )}
              </a>
              <a href="/bugs-rant" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>{strings.cards.bugsRant.title}</strong>
                <div className="list-meta">{strings.cards.bugsRant.description}</div>
                {sectionData && sectionData.bugsRant && (
                  <div className="section-stats">
                    {sectionData.bugsRant.count > 0 ? (
                      <>
                        <span>{sectionData.bugsRant.count} {sectionData.bugsRant.count === 1 ? 'post' : 'posts'}</span>
                        {sectionData.bugsRant.recent && (
                          <span>
                            {' · '}
                            Latest:{' '}
                            <a
                              href={sectionData.bugsRant.recent.url}
                              style={{ color: 'var(--errl-accent-3)', textDecoration: 'none' }}
                            >
                              {sectionData.bugsRant.recent.title}
                            </a>
                            {' by '}
                            <Username
                              name={sectionData.bugsRant.recent.author}
                              colorIndex={getUsernameColorIndex(sectionData.bugsRant.recent.author)}
                            />{' '}
                            {sectionData.bugsRant.recent.timeAgo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{strings.cards.bugsRant.empty}</span>
                    )}
                  </div>
                )}
              </a>
              {hasUsername && sectionData?.devlog !== null && (
                <a href="/devlog" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <strong>{strings.cards.devlog.title}</strong>
                  <div className="list-meta">{strings.cards.devlog.description}</div>
                  {sectionData && sectionData.devlog && (
                    <div className="section-stats">
                      {sectionData.devlog.count > 0 ? (
                        <>
                          <span>{sectionData.devlog.count} {sectionData.devlog.count === 1 ? 'post' : 'posts'}</span>
                          {sectionData.devlog.recent && (
                            <span>
                              {' · '}
                              Latest:{' '}
                              <a
                                href={sectionData.devlog.recent.url}
                                style={{ color: 'var(--errl-accent-3)', textDecoration: 'none' }}
                              >
                                {sectionData.devlog.recent.title}
                              </a>
                              {' by '}
                              <Username
                                name={sectionData.devlog.recent.author}
                                colorIndex={getUsernameColorIndex(sectionData.devlog.recent.author)}
                              />{' '}
                              {sectionData.devlog.recent.timeAgo}
                            </span>
                          )}
                        </>
                      ) : (
                        <span>{strings.cards.devlog.empty}</span>
                      )}
                    </div>
                  )}
                </a>
              )}
              {hasUsername && sectionData?.loreMemories !== null && (
                <a href="/lore-memories" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <strong>{strings.cards.loreMemories.title}</strong>
                  <div className="list-meta">{strings.cards.loreMemories.description}</div>
                  {sectionData && sectionData.loreMemories && (
                    <div className="section-stats">
                      {sectionData.loreMemories.count > 0 ? (
                        <>
                          <span>{sectionData.loreMemories.count} {sectionData.loreMemories.count === 1 ? 'post' : 'posts'}</span>
                          {sectionData.loreMemories.recent && (
                            <span>
                              {' · '}
                              Latest:{' '}
                              <a
                                href={sectionData.loreMemories.recent.url}
                                style={{ color: 'var(--errl-accent-3)', textDecoration: 'none' }}
                              >
                                {sectionData.loreMemories.recent.title}
                              </a>
                              {' by '}
                              <Username
                                name={sectionData.loreMemories.recent.author}
                                colorIndex={getUsernameColorIndex(sectionData.loreMemories.recent.author)}
                              />{' '}
                              {sectionData.loreMemories.recent.timeAgo}
                            </span>
                          )}
                        </>
                      ) : (
                        <span>{strings.cards.loreMemories.empty}</span>
                      )}
                    </div>
                  )}
                </a>
              )}
          </div>
        </section>
      )}
    </div>
  );
}
