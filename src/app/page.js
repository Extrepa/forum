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
import HomeWelcome from '../components/HomeWelcome';
import HomeStats from '../components/HomeStats';
import HomeRecentFeed from '../components/HomeRecentFeed';
import HomeSectionCard from '../components/HomeSectionCard';

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

export default async function HomePage({ searchParams }) {
  const user = await getSessionUser();
  const hasUsername = !!user;
  
  // Check landing page preference and redirect if set to 'feed'
  // Only redirect on direct navigation (no ?home param), not when clicking "Home" link
  if (hasUsername && !searchParams?.home) {
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
    
    // Get most recent thread
    const forumRecentPost = await safeFirst(
      db,
      `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at,
              users.username AS author_name
       FROM forum_threads
       JOIN users ON users.id = forum_threads.author_user_id
       WHERE (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
         AND (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '')
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
    
    // Get most recent reply
    let forumRecentReply = null;
    try {
      forumRecentReply = await db
        .prepare(
          `SELECT forum_replies.created_at,
                  forum_threads.id AS thread_id, forum_threads.title AS thread_title,
                  reply_users.username AS reply_author,
                  thread_users.username AS thread_author
           FROM forum_replies
           JOIN forum_threads ON forum_threads.id = forum_replies.thread_id
           JOIN users AS reply_users ON reply_users.id = forum_replies.author_user_id
           JOIN users AS thread_users ON thread_users.id = forum_threads.author_user_id
           WHERE (forum_replies.is_deleted = 0 OR forum_replies.is_deleted IS NULL)
             AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL)
           ORDER BY forum_replies.created_at DESC
           LIMIT 1`
        )
        .first();
    } catch (e) {
      // Table might not exist yet
    }
    
    // Compare and use whichever is newer
    let forumRecent = null;
    if (forumRecentPost && forumRecentReply) {
      if (forumRecentReply.created_at > forumRecentPost.created_at) {
        forumRecent = {
          type: 'reply',
          postId: forumRecentReply.thread_id,
          postTitle: forumRecentReply.thread_title,
          postAuthor: forumRecentReply.thread_author,
          activityAuthor: forumRecentReply.reply_author,
          createdAt: forumRecentReply.created_at,
          href: `/lobby/${forumRecentReply.thread_id}`
        };
      } else {
        forumRecent = {
          type: 'post',
          postId: forumRecentPost.id,
          postTitle: forumRecentPost.title,
          postAuthor: forumRecentPost.author_name,
          activityAuthor: forumRecentPost.author_name,
          createdAt: forumRecentPost.created_at,
          href: `/lobby/${forumRecentPost.id}`
        };
      }
    } else if (forumRecentPost) {
      forumRecent = {
        type: 'post',
        postId: forumRecentPost.id,
        postTitle: forumRecentPost.title,
        postAuthor: forumRecentPost.author_name,
        activityAuthor: forumRecentPost.author_name,
        createdAt: forumRecentPost.created_at,
        href: `/lobby/${forumRecentPost.id}`
      };
    } else if (forumRecentReply) {
      forumRecent = {
        type: 'reply',
        postId: forumRecentReply.thread_id,
        postTitle: forumRecentReply.thread_title,
        postAuthor: forumRecentReply.thread_author,
        activityAuthor: forumRecentReply.reply_author,
        createdAt: forumRecentReply.created_at,
        href: `/lobby/${forumRecentReply.thread_id}`
      };
    }

    // Events
    const eventsCount = await safeFirst(
      db,
      'SELECT COUNT(*) as count FROM events WHERE moved_to_id IS NULL',
      [],
      'SELECT COUNT(*) as count FROM events',
      []
    );
    
    const eventsRecentPost = await safeFirst(
      db,
      `SELECT events.id, events.title, events.created_at,
              users.username AS author_name
       FROM events
       JOIN users ON users.id = events.author_user_id
       WHERE (events.is_deleted = 0 OR events.is_deleted IS NULL)
         AND (events.moved_to_id IS NULL OR events.moved_to_id = '')
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
    
    let eventsRecentComment = null;
    try {
      eventsRecentComment = await db
        .prepare(
          `SELECT event_comments.created_at,
                  events.id AS event_id, events.title AS event_title,
                  comment_users.username AS comment_author,
                  event_users.username AS event_author
           FROM event_comments
           JOIN events ON events.id = event_comments.event_id
           JOIN users AS comment_users ON comment_users.id = event_comments.author_user_id
           JOIN users AS event_users ON event_users.id = events.author_user_id
           WHERE (event_comments.is_deleted = 0 OR event_comments.is_deleted IS NULL)
             AND (events.is_deleted = 0 OR events.is_deleted IS NULL)
           ORDER BY event_comments.created_at DESC
           LIMIT 1`
        )
        .first();
    } catch (e) {
      // Table might not exist yet
    }
    
    let eventsRecent = null;
    if (eventsRecentPost && eventsRecentComment) {
      if (eventsRecentComment.created_at > eventsRecentPost.created_at) {
        eventsRecent = {
          type: 'comment',
          postId: eventsRecentComment.event_id,
          postTitle: eventsRecentComment.event_title,
          postAuthor: eventsRecentComment.event_author,
          activityAuthor: eventsRecentComment.comment_author,
          createdAt: eventsRecentComment.created_at,
          href: `/events/${eventsRecentComment.event_id}`
        };
      } else {
        eventsRecent = {
          type: 'post',
          postId: eventsRecentPost.id,
          postTitle: eventsRecentPost.title,
          postAuthor: eventsRecentPost.author_name,
          activityAuthor: eventsRecentPost.author_name,
          createdAt: eventsRecentPost.created_at,
          href: `/events/${eventsRecentPost.id}`
        };
      }
    } else if (eventsRecentPost) {
      eventsRecent = {
        type: 'post',
        postId: eventsRecentPost.id,
        postTitle: eventsRecentPost.title,
        postAuthor: eventsRecentPost.author_name,
        activityAuthor: eventsRecentPost.author_name,
        createdAt: eventsRecentPost.created_at,
        href: `/events/${eventsRecentPost.id}`
      };
    } else if (eventsRecentComment) {
      eventsRecent = {
        type: 'comment',
        postId: eventsRecentComment.event_id,
        postTitle: eventsRecentComment.event_title,
        postAuthor: eventsRecentComment.event_author,
        activityAuthor: eventsRecentComment.comment_author,
        createdAt: eventsRecentComment.created_at,
        href: `/events/${eventsRecentComment.event_id}`
      };
    }

    // Music
    const musicCount = await safeFirst(
      db,
      'SELECT COUNT(*) as count FROM music_posts WHERE moved_to_id IS NULL',
      [],
      'SELECT COUNT(*) as count FROM music_posts',
      []
    );
    
    const musicRecentPost = await safeFirst(
      db,
      `SELECT music_posts.id, music_posts.title, music_posts.created_at,
              users.username AS author_name
       FROM music_posts
       JOIN users ON users.id = music_posts.author_user_id
       WHERE (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)
         AND (music_posts.moved_to_id IS NULL OR music_posts.moved_to_id = '')
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
    
    let musicRecentComment = null;
    try {
      musicRecentComment = await db
        .prepare(
          `SELECT music_comments.created_at,
                  music_posts.id AS post_id, music_posts.title AS post_title,
                  comment_users.username AS comment_author,
                  post_users.username AS post_author
           FROM music_comments
           JOIN music_posts ON music_posts.id = music_comments.post_id
           JOIN users AS comment_users ON comment_users.id = music_comments.author_user_id
           JOIN users AS post_users ON post_users.id = music_posts.author_user_id
           WHERE (music_comments.is_deleted = 0 OR music_comments.is_deleted IS NULL)
             AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL)
           ORDER BY music_comments.created_at DESC
           LIMIT 1`
        )
        .first();
    } catch (e) {
      // Table might not exist yet
    }
    
    let musicRecent = null;
    if (musicRecentPost && musicRecentComment) {
      if (musicRecentComment.created_at > musicRecentPost.created_at) {
        musicRecent = {
          type: 'comment',
          postId: musicRecentComment.post_id,
          postTitle: musicRecentComment.post_title,
          postAuthor: musicRecentComment.post_author,
          activityAuthor: musicRecentComment.comment_author,
          createdAt: musicRecentComment.created_at,
          href: `/music/${musicRecentComment.post_id}`
        };
      } else {
        musicRecent = {
          type: 'post',
          postId: musicRecentPost.id,
          postTitle: musicRecentPost.title,
          postAuthor: musicRecentPost.author_name,
          activityAuthor: musicRecentPost.author_name,
          createdAt: musicRecentPost.created_at,
          href: `/music/${musicRecentPost.id}`
        };
      }
    } else if (musicRecentPost) {
      musicRecent = {
        type: 'post',
        postId: musicRecentPost.id,
        postTitle: musicRecentPost.title,
        postAuthor: musicRecentPost.author_name,
        activityAuthor: musicRecentPost.author_name,
        createdAt: musicRecentPost.created_at,
        href: `/music/${musicRecentPost.id}`
      };
    } else if (musicRecentComment) {
      musicRecent = {
        type: 'comment',
        postId: musicRecentComment.post_id,
        postTitle: musicRecentComment.post_title,
        postAuthor: musicRecentComment.post_author,
        activityAuthor: musicRecentComment.comment_author,
        createdAt: musicRecentComment.created_at,
        href: `/music/${musicRecentComment.post_id}`
      };
    }

    // Projects
    const projectsCount = await safeFirst(
      db,
      'SELECT COUNT(*) as count FROM projects WHERE moved_to_id IS NULL',
      [],
      'SELECT COUNT(*) as count FROM projects',
      []
    );
    
    const projectsRecentPost = await safeFirst(
      db,
      `SELECT projects.id, projects.title, projects.created_at,
              users.username AS author_name
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       WHERE (projects.is_deleted = 0 OR projects.is_deleted IS NULL)
         AND (projects.moved_to_id IS NULL OR projects.moved_to_id = '')
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
    
    let projectsRecentReply = null;
    try {
      projectsRecentReply = await db
        .prepare(
          `SELECT project_replies.created_at,
                  projects.id AS project_id, projects.title AS project_title,
                  reply_users.username AS reply_author,
                  project_users.username AS project_author
           FROM project_replies
           JOIN projects ON projects.id = project_replies.project_id
           JOIN users AS reply_users ON reply_users.id = project_replies.author_user_id
           JOIN users AS project_users ON project_users.id = projects.author_user_id
           WHERE (project_replies.is_deleted = 0 OR project_replies.is_deleted IS NULL)
             AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)
           ORDER BY project_replies.created_at DESC
           LIMIT 1`
        )
        .first();
    } catch (e) {
      // Table might not exist yet
    }
    
    let projectsRecent = null;
    if (projectsRecentPost && projectsRecentReply) {
      if (projectsRecentReply.created_at > projectsRecentPost.created_at) {
        projectsRecent = {
          type: 'reply',
          postId: projectsRecentReply.project_id,
          postTitle: projectsRecentReply.project_title,
          postAuthor: projectsRecentReply.project_author,
          activityAuthor: projectsRecentReply.reply_author,
          createdAt: projectsRecentReply.created_at,
          href: `/projects/${projectsRecentReply.project_id}`
        };
      } else {
        projectsRecent = {
          type: 'post',
          postId: projectsRecentPost.id,
          postTitle: projectsRecentPost.title,
          postAuthor: projectsRecentPost.author_name,
          activityAuthor: projectsRecentPost.author_name,
          createdAt: projectsRecentPost.created_at,
          href: `/projects/${projectsRecentPost.id}`
        };
      }
    } else if (projectsRecentPost) {
      projectsRecent = {
        type: 'post',
        postId: projectsRecentPost.id,
        postTitle: projectsRecentPost.title,
        postAuthor: projectsRecentPost.author_name,
        activityAuthor: projectsRecentPost.author_name,
        createdAt: projectsRecentPost.created_at,
        href: `/projects/${projectsRecentPost.id}`
      };
    } else if (projectsRecentReply) {
      projectsRecent = {
        type: 'reply',
        postId: projectsRecentReply.project_id,
        postTitle: projectsRecentReply.project_title,
        postAuthor: projectsRecentReply.project_author,
        activityAuthor: projectsRecentReply.reply_author,
        createdAt: projectsRecentReply.created_at,
        href: `/projects/${projectsRecentReply.project_id}`
      };
    }

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
        
        const devlogRecentPost = await safeFirst(
          db,
          `SELECT dev_logs.id, dev_logs.title, dev_logs.created_at,
                  users.username AS author_name
           FROM dev_logs
           JOIN users ON users.id = dev_logs.author_user_id
           WHERE (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL)
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
        
        let devlogRecentComment = null;
        try {
          devlogRecentComment = await db
            .prepare(
              `SELECT dev_log_comments.created_at,
                      dev_logs.id AS log_id, dev_logs.title AS log_title,
                      comment_users.username AS comment_author,
                      log_users.username AS log_author
               FROM dev_log_comments
               JOIN dev_logs ON dev_logs.id = dev_log_comments.log_id
               JOIN users AS comment_users ON comment_users.id = dev_log_comments.author_user_id
               JOIN users AS log_users ON log_users.id = dev_logs.author_user_id
               WHERE (dev_log_comments.is_deleted = 0 OR dev_log_comments.is_deleted IS NULL)
                 AND (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL)
               ORDER BY dev_log_comments.created_at DESC
               LIMIT 1`
            )
            .first();
        } catch (e) {
          // Table might not exist yet
        }
        
        if (devlogRecentPost && devlogRecentComment) {
          if (devlogRecentComment.created_at > devlogRecentPost.created_at) {
            devlogRecent = {
              type: 'comment',
              postId: devlogRecentComment.log_id,
              postTitle: devlogRecentComment.log_title,
              postAuthor: devlogRecentComment.log_author,
              activityAuthor: devlogRecentComment.comment_author,
              createdAt: devlogRecentComment.created_at,
              href: `/devlog/${devlogRecentComment.log_id}`
            };
          } else {
            devlogRecent = {
              type: 'post',
              postId: devlogRecentPost.id,
              postTitle: devlogRecentPost.title,
              postAuthor: devlogRecentPost.author_name,
              activityAuthor: devlogRecentPost.author_name,
              createdAt: devlogRecentPost.created_at,
              href: `/devlog/${devlogRecentPost.id}`
            };
          }
        } else if (devlogRecentPost) {
          devlogRecent = {
            type: 'post',
            postId: devlogRecentPost.id,
            postTitle: devlogRecentPost.title,
            postAuthor: devlogRecentPost.author_name,
            activityAuthor: devlogRecentPost.author_name,
            createdAt: devlogRecentPost.created_at,
            href: `/devlog/${devlogRecentPost.id}`
          };
        } else if (devlogRecentComment) {
          devlogRecent = {
            type: 'comment',
            postId: devlogRecentComment.log_id,
            postTitle: devlogRecentComment.log_title,
            postAuthor: devlogRecentComment.log_author,
            activityAuthor: devlogRecentComment.comment_author,
            createdAt: devlogRecentComment.created_at,
            href: `/devlog/${devlogRecentComment.log_id}`
          };
        }
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
              type: forumRecent.type,
              postId: forumRecent.postId,
              postTitle: forumRecent.postTitle,
              postAuthor: forumRecent.postAuthor,
              activityAuthor: forumRecent.activityAuthor,
              timeAgo: formatTimeAgo(forumRecent.createdAt),
              href: forumRecent.href
            }
          : null
      },
      events: {
        count: eventsCount?.count || 0,
        recent: eventsRecent
          ? {
              type: eventsRecent.type,
              postId: eventsRecent.postId,
              postTitle: eventsRecent.postTitle,
              postAuthor: eventsRecent.postAuthor,
              activityAuthor: eventsRecent.activityAuthor,
              timeAgo: formatTimeAgo(eventsRecent.createdAt),
              href: eventsRecent.href
            }
          : null
      },
      music: {
        count: musicCount?.count || 0,
        recent: musicRecent
          ? {
              type: musicRecent.type,
              postId: musicRecent.postId,
              postTitle: musicRecent.postTitle,
              postAuthor: musicRecent.postAuthor,
              activityAuthor: musicRecent.activityAuthor,
              timeAgo: formatTimeAgo(musicRecent.createdAt),
              href: musicRecent.href
            }
          : null
      },
      projects: {
        count: projectsCount?.count || 0,
        recent: projectsRecent
          ? {
              type: projectsRecent.type,
              postId: projectsRecent.postId,
              postTitle: projectsRecent.postTitle,
              postAuthor: projectsRecent.postAuthor,
              activityAuthor: projectsRecent.activityAuthor,
              timeAgo: formatTimeAgo(projectsRecent.createdAt),
              href: projectsRecent.href
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
              type: devlogRecent.type,
              postId: devlogRecent.postId,
              postTitle: devlogRecent.postTitle,
              postAuthor: devlogRecent.postAuthor,
              activityAuthor: devlogRecent.activityAuthor,
              timeAgo: formatTimeAgo(devlogRecent.createdAt),
              href: devlogRecent.href
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

  // Calculate stats and recent posts for signed-in users
  let stats = null;
  let recentPosts = [];
  if (hasUsername && sectionData) {
    const db = await getDb();
    try {
      // Total posts across all sections
      const totalPosts = 
        (sectionData.timeline?.count || 0) +
        (sectionData.forum?.count || 0) +
        (sectionData.events?.count || 0) +
        (sectionData.music?.count || 0) +
        (sectionData.projects?.count || 0) +
        (sectionData.shitposts?.count || 0) +
        (sectionData.artNostalgia?.count || 0) +
        (sectionData.bugsRant?.count || 0) +
        (sectionData.devlog?.count || 0);

      // Active users (users who posted in last 30 days)
      let activeUsersResult = null;
      try {
        activeUsersResult = await db
          .prepare(
            `SELECT COUNT(DISTINCT author_user_id) as count
             FROM (
               SELECT author_user_id FROM forum_threads WHERE created_at > ? AND (is_deleted = 0 OR is_deleted IS NULL)
               UNION
               SELECT author_user_id FROM forum_replies WHERE created_at > ? AND (is_deleted = 0 OR is_deleted IS NULL)
               UNION
               SELECT author_user_id FROM events WHERE created_at > ? AND (is_deleted = 0 OR is_deleted IS NULL)
               UNION
               SELECT author_user_id FROM music_posts WHERE created_at > ? AND (is_deleted = 0 OR is_deleted IS NULL)
               UNION
               SELECT author_user_id FROM projects WHERE created_at > ? AND (is_deleted = 0 OR is_deleted IS NULL)
             )`
          )
          .bind(Date.now() - 30 * 24 * 60 * 60 * 1000, Date.now() - 30 * 24 * 60 * 60 * 1000, Date.now() - 30 * 24 * 60 * 60 * 1000, Date.now() - 30 * 24 * 60 * 60 * 1000, Date.now() - 30 * 24 * 60 * 60 * 1000)
          .first();
      } catch (e) {
        // Tables might not exist yet
      }
      
      // Recent activity (last 24 hours)
      let recentActivityResult = null;
      try {
        recentActivityResult = await db
          .prepare(
            `SELECT COUNT(*) as count
             FROM (
               SELECT created_at FROM forum_threads WHERE created_at > ? AND (is_deleted = 0 OR is_deleted IS NULL)
               UNION ALL
               SELECT created_at FROM forum_replies WHERE created_at > ? AND (is_deleted = 0 OR is_deleted IS NULL)
               UNION ALL
               SELECT created_at FROM events WHERE created_at > ? AND (is_deleted = 0 OR is_deleted IS NULL)
               UNION ALL
               SELECT created_at FROM music_posts WHERE created_at > ? AND (is_deleted = 0 OR is_deleted IS NULL)
               UNION ALL
               SELECT created_at FROM projects WHERE created_at > ? AND (is_deleted = 0 OR is_deleted IS NULL)
             )`
          )
          .bind(Date.now() - 24 * 60 * 60 * 1000, Date.now() - 24 * 60 * 60 * 1000, Date.now() - 24 * 60 * 60 * 1000, Date.now() - 24 * 60 * 60 * 1000, Date.now() - 24 * 60 * 60 * 1000)
          .first();
      } catch (e) {
        // Tables might not exist yet
      }

      stats = {
        totalPosts,
        activeUsers: activeUsersResult?.count || 0,
        recentActivity: recentActivityResult?.count || 0
      };

      // Get recent posts from all sections (last 15)
      try {
        const recentPostsResult = await db
          .prepare(
            `SELECT 'forum' as section, id, title, created_at, author_user_id, 'forum_thread' as post_type
             FROM forum_threads
             WHERE (is_deleted = 0 OR is_deleted IS NULL)
             UNION ALL
             SELECT 'event' as section, id, title, created_at, author_user_id, 'event' as post_type
             FROM events
             WHERE (is_deleted = 0 OR is_deleted IS NULL)
             UNION ALL
             SELECT 'music' as section, id, title, created_at, author_user_id, 'music_post' as post_type
             FROM music_posts
             WHERE (is_deleted = 0 OR is_deleted IS NULL)
             UNION ALL
             SELECT 'project' as section, id, title, created_at, author_user_id, 'project' as post_type
             FROM projects
             WHERE (is_deleted = 0 OR is_deleted IS NULL)
             ORDER BY created_at DESC
             LIMIT 15`
          )
          .all();

        if (recentPostsResult?.results) {
          for (const post of recentPostsResult.results) {
            try {
              const authorResult = await db
                .prepare('SELECT username FROM users WHERE id = ?')
                .bind(post.author_user_id)
                .first();
              
              recentPosts.push({
                id: post.id,
                title: post.title,
                author_name: authorResult?.username || 'Unknown',
                created_at: post.created_at,
                section: post.section,
                href: `/${post.section}/${post.id}`
              });
            } catch (e) {
              // Skip if user lookup fails
            }
          }
        }
      } catch (e) {
        // Tables might not exist yet
      }
    } catch (e) {
      // Fallback if queries fail
      stats = {
        totalPosts: 0,
        activeUsers: 0,
        recentActivity: 0
      };
    }
  }

  return (
    <div className="stack">
      {!hasUsername && (
        <>
          <HomeWelcome user={null} />
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
        <>
          <HomeWelcome user={user} />
          <HomeStats stats={stats} />
          <HomeRecentFeed recentPosts={recentPosts} />
          <section className="card">
            <h3 className="section-title" style={{ marginBottom: '16px' }}>Explore Sections</h3>
            <div className="list grid-tiles">
              <HomeSectionCard
                title={strings.cards.announcements.title}
                description={strings.cards.announcements.description}
                count={sectionData?.timeline?.count || 0}
                recentActivity={sectionData?.timeline?.recent ? {
                  type: 'post',
                  postTitle: sectionData.timeline.recent.title,
                  postAuthor: sectionData.timeline.recent.author,
                  activityAuthor: sectionData.timeline.recent.author,
                  timeAgo: sectionData.timeline.recent.timeAgo,
                  href: sectionData.timeline.recent.url
                } : null}
                href="/announcements"
              />
              <HomeSectionCard
                title={strings.cards.general.title}
                description={strings.cards.general.description}
                count={sectionData?.forum?.count || 0}
                recentActivity={sectionData?.forum?.recent || null}
                href="/lobby"
              />
              <HomeSectionCard
                title={strings.cards.events.title}
                description={strings.cards.events.description}
                count={sectionData?.events?.count || 0}
                recentActivity={sectionData?.events?.recent || null}
                href="/events"
              />
              <HomeSectionCard
                title={strings.cards.music.title}
                description={strings.cards.music.description}
                count={sectionData?.music?.count || 0}
                recentActivity={sectionData?.music?.recent || null}
                href="/music"
              />
              <HomeSectionCard
                title={strings.cards.projects.title}
                description={strings.cards.projects.description}
                count={sectionData?.projects?.count || 0}
                recentActivity={sectionData?.projects?.recent || null}
                href="/projects"
              />
              <HomeSectionCard
                title={strings.cards.shitposts.title}
                description={strings.cards.shitposts.description}
                count={sectionData?.shitposts?.count || 0}
                recentActivity={sectionData?.shitposts?.recent ? {
                  type: 'post',
                  postTitle: sectionData.shitposts.recent.title,
                  postAuthor: sectionData.shitposts.recent.author,
                  activityAuthor: sectionData.shitposts.recent.author,
                  timeAgo: sectionData.shitposts.recent.timeAgo,
                  href: sectionData.shitposts.recent.url
                } : null}
                href="/shitposts"
              />
              {sectionData?.artNostalgia && (
                <HomeSectionCard
                  title={strings.cards.artNostalgia.title}
                  description={strings.cards.artNostalgia.description}
                  count={sectionData.artNostalgia.count || 0}
                  recentActivity={sectionData.artNostalgia.recent ? {
                    type: 'post',
                    postTitle: sectionData.artNostalgia.recent.title || 'Untitled',
                    postAuthor: sectionData.artNostalgia.recent.author,
                    activityAuthor: sectionData.artNostalgia.recent.author,
                    timeAgo: sectionData.artNostalgia.recent.timeAgo,
                    href: sectionData.artNostalgia.recent.url
                  } : null}
                  href="/art-nostalgia"
                />
              )}
              {sectionData?.bugsRant && (
                <HomeSectionCard
                  title={strings.cards.bugsRant.title}
                  description={strings.cards.bugsRant.description}
                  count={sectionData.bugsRant.count || 0}
                  recentActivity={sectionData.bugsRant.recent ? {
                    type: 'post',
                    postTitle: sectionData.bugsRant.recent.title || 'Untitled',
                    postAuthor: sectionData.bugsRant.recent.author,
                    activityAuthor: sectionData.bugsRant.recent.author,
                    timeAgo: sectionData.bugsRant.recent.timeAgo,
                    href: sectionData.bugsRant.recent.url
                  } : null}
                  href="/bugs-rant"
                />
              )}
              {hasUsername && sectionData?.devlog !== null && (
                <HomeSectionCard
                  title={strings.cards.devlog.title}
                  description={strings.cards.devlog.description}
                  count={sectionData.devlog?.count || 0}
                  recentActivity={sectionData.devlog?.recent || null}
                  href="/devlog"
                />
              )}
              {hasUsername && sectionData?.loreMemories !== null && (
                <HomeSectionCard
                  title={strings.cards.loreMemories.title}
                  description={strings.cards.loreMemories.description}
                  count={sectionData.loreMemories.count || 0}
                  recentActivity={sectionData.loreMemories.recent ? {
                    type: 'post',
                    postTitle: sectionData.loreMemories.recent.title || 'Untitled',
                    postAuthor: sectionData.loreMemories.recent.author,
                    activityAuthor: sectionData.loreMemories.recent.author,
                    timeAgo: sectionData.loreMemories.recent.timeAgo,
                    href: sectionData.loreMemories.recent.url
                  } : null}
                  href="/lore-memories"
                />
              )}
          </div>
        </section>
      )}
    </div>
  );
}
