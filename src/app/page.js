import ClaimUsernameForm from '../components/ClaimUsernameForm';
import { redirect } from 'next/navigation';
import { getSessionUser } from '../lib/auth';
import { getDb } from '../lib/db';
import Username from '../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../lib/usernameColor';
import {
  getForumStrings
} from '../lib/forum-texts';
import HomeSectionCard from '../components/HomeSectionCard';

export const dynamic = 'force-dynamic';

function formatTimeAgo(timestamp) {
  // Ensure timestamp is a valid number
  const ts = Number(timestamp);
  if (!ts || isNaN(ts) || ts <= 0) {
    return 'just now';
  }
  
  const now = Date.now();
  const diff = now - ts;
  
  // Handle future timestamps or invalid diffs
  if (diff < 0) {
    return 'just now';
  }
  
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

  // Fetch section data for logged-in users (parallelized to reduce CPU time)
  let sectionData = null;
  if (hasUsername) {
    const db = await getDb();
    const safeFirstNull = (d, sql) => d.prepare(sql).first().catch(() => null);

    const results = await Promise.all([
      safeFirst(db, 'SELECT COUNT(*) as count FROM timeline_updates WHERE moved_to_id IS NULL AND (is_deleted = 0 OR is_deleted IS NULL)', [], 'SELECT COUNT(*) as count FROM timeline_updates WHERE (is_deleted = 0 OR is_deleted IS NULL)', []),
      safeFirst(db, `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM timeline_updates JOIN users ON users.id = timeline_updates.author_user_id WHERE timeline_updates.moved_to_id IS NULL AND (timeline_updates.is_deleted = 0 OR timeline_updates.is_deleted IS NULL) ORDER BY timeline_updates.created_at DESC LIMIT 1`, [], `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM timeline_updates JOIN users ON users.id = timeline_updates.author_user_id WHERE (timeline_updates.is_deleted = 0 OR timeline_updates.is_deleted IS NULL) ORDER BY timeline_updates.created_at DESC LIMIT 1`, []),
      safeFirst(db, 'SELECT COUNT(*) as count FROM forum_threads WHERE moved_to_id IS NULL AND (is_deleted = 0 OR is_deleted IS NULL)', [], 'SELECT COUNT(*) as count FROM forum_threads WHERE (is_deleted = 0 OR is_deleted IS NULL)', []),
      safeFirst(db, `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM forum_threads JOIN users ON users.id = forum_threads.author_user_id WHERE (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL) AND (forum_threads.moved_to_id IS NULL OR forum_threads.moved_to_id = '') ORDER BY forum_threads.created_at DESC LIMIT 1`, [], `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM forum_threads JOIN users ON users.id = forum_threads.author_user_id ORDER BY forum_threads.created_at DESC LIMIT 1`, []),
      safeFirstNull(db, `SELECT forum_replies.created_at, forum_threads.id AS thread_id, forum_threads.title AS thread_title, reply_users.username AS reply_author, reply_users.preferred_username_color_index AS reply_author_color_preference, thread_users.username AS thread_author, thread_users.preferred_username_color_index AS thread_author_color_preference FROM forum_replies JOIN forum_threads ON forum_threads.id = forum_replies.thread_id JOIN users AS reply_users ON reply_users.id = forum_replies.author_user_id JOIN users AS thread_users ON thread_users.id = forum_threads.author_user_id WHERE (forum_replies.is_deleted = 0 OR forum_replies.is_deleted IS NULL) AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL) ORDER BY forum_replies.created_at DESC LIMIT 1`),
      safeFirst(db, 'SELECT COUNT(*) as count FROM events WHERE moved_to_id IS NULL AND (is_deleted = 0 OR is_deleted IS NULL)', [], 'SELECT COUNT(*) as count FROM events WHERE (is_deleted = 0 OR is_deleted IS NULL)', []),
      safeFirst(db, `SELECT events.id, events.title, events.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM events JOIN users ON users.id = events.author_user_id WHERE (events.is_deleted = 0 OR events.is_deleted IS NULL) AND (events.moved_to_id IS NULL OR events.moved_to_id = '') ORDER BY events.created_at DESC LIMIT 1`, [], `SELECT events.id, events.title, events.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM events JOIN users ON users.id = events.author_user_id ORDER BY events.created_at DESC LIMIT 1`, []),
      safeFirstNull(db, `SELECT event_comments.created_at, events.id AS event_id, events.title AS event_title, comment_users.username AS comment_author, comment_users.preferred_username_color_index AS comment_author_color_preference, event_users.username AS event_author, event_users.preferred_username_color_index AS event_author_color_preference FROM event_comments JOIN events ON events.id = event_comments.event_id JOIN users AS comment_users ON comment_users.id = event_comments.author_user_id JOIN users AS event_users ON event_users.id = events.author_user_id WHERE (event_comments.is_deleted = 0 OR event_comments.is_deleted IS NULL) AND (events.is_deleted = 0 OR events.is_deleted IS NULL) ORDER BY event_comments.created_at DESC LIMIT 1`),
      safeFirst(db, 'SELECT COUNT(*) as count FROM music_posts WHERE moved_to_id IS NULL AND (is_deleted = 0 OR is_deleted IS NULL)', [], 'SELECT COUNT(*) as count FROM music_posts WHERE (is_deleted = 0 OR is_deleted IS NULL)', []),
      safeFirst(db, `SELECT music_posts.id, music_posts.title, music_posts.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM music_posts JOIN users ON users.id = music_posts.author_user_id WHERE (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL) AND (music_posts.moved_to_id IS NULL OR music_posts.moved_to_id = '') ORDER BY music_posts.created_at DESC LIMIT 1`, [], `SELECT music_posts.id, music_posts.title, music_posts.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM music_posts JOIN users ON users.id = music_posts.author_user_id ORDER BY music_posts.created_at DESC LIMIT 1`, []),
      safeFirstNull(db, `SELECT music_comments.created_at, music_posts.id AS post_id, music_posts.title AS post_title, comment_users.username AS comment_author, comment_users.preferred_username_color_index AS comment_author_color_preference, post_users.username AS post_author, post_users.preferred_username_color_index AS post_author_color_preference FROM music_comments JOIN music_posts ON music_posts.id = music_comments.post_id JOIN users AS comment_users ON comment_users.id = music_comments.author_user_id JOIN users AS post_users ON post_users.id = music_posts.author_user_id WHERE (music_comments.is_deleted = 0 OR music_comments.is_deleted IS NULL) AND (music_posts.is_deleted = 0 OR music_posts.is_deleted IS NULL) ORDER BY music_comments.created_at DESC LIMIT 1`),
      safeFirst(db, 'SELECT COUNT(*) as count FROM projects WHERE moved_to_id IS NULL AND (is_deleted = 0 OR is_deleted IS NULL)', [], 'SELECT COUNT(*) as count FROM projects WHERE (is_deleted = 0 OR is_deleted IS NULL)', []),
      safeFirst(db, `SELECT projects.id, projects.title, projects.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM projects JOIN users ON users.id = projects.author_user_id WHERE (projects.is_deleted = 0 OR projects.is_deleted IS NULL) AND (projects.moved_to_id IS NULL OR projects.moved_to_id = '') ORDER BY projects.created_at DESC LIMIT 1`, [], `SELECT projects.id, projects.title, projects.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM projects JOIN users ON users.id = projects.author_user_id ORDER BY projects.created_at DESC LIMIT 1`, []),
      safeFirstNull(db, `SELECT project_replies.created_at, projects.id AS project_id, projects.title AS project_title, reply_users.username AS reply_author, reply_users.preferred_username_color_index AS reply_author_color_preference, project_users.username AS project_author, project_users.preferred_username_color_index AS project_author_color_preference FROM project_replies JOIN projects ON projects.id = project_replies.project_id JOIN users AS reply_users ON reply_users.id = project_replies.author_user_id JOIN users AS project_users ON project_users.id = projects.author_user_id WHERE (project_replies.is_deleted = 0 OR project_replies.is_deleted IS NULL) AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL) ORDER BY project_replies.created_at DESC LIMIT 1`),
      safeFirst(db, 'SELECT COUNT(*) as count FROM forum_threads WHERE image_key IS NOT NULL AND moved_to_id IS NULL AND (is_deleted = 0 OR is_deleted IS NULL)', [], 'SELECT COUNT(*) as count FROM forum_threads WHERE image_key IS NOT NULL AND (is_deleted = 0 OR is_deleted IS NULL)', []),
      safeFirst(db, `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM forum_threads JOIN users ON users.id = forum_threads.author_user_id WHERE forum_threads.image_key IS NOT NULL AND forum_threads.moved_to_id IS NULL AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL) ORDER BY forum_threads.created_at DESC LIMIT 1`, [], `SELECT forum_threads.id, forum_threads.title, forum_threads.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM forum_threads JOIN users ON users.id = forum_threads.author_user_id WHERE forum_threads.image_key IS NOT NULL AND (forum_threads.is_deleted = 0 OR forum_threads.is_deleted IS NULL) ORDER BY forum_threads.created_at DESC LIMIT 1`, []),
      safeFirst(db, `SELECT COUNT(*) as count FROM posts WHERE type IN ('art', 'nostalgia') AND (is_deleted = 0 OR is_deleted IS NULL) AND (1=1)`, [], 'SELECT COUNT(*) as count FROM posts WHERE type IN (\'art\', \'nostalgia\') AND (is_deleted = 0 OR is_deleted IS NULL)', []),
      safeFirst(db, `SELECT posts.id, posts.title, posts.created_at, posts.type, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM posts JOIN users ON users.id = posts.author_user_id WHERE posts.type IN ('art', 'nostalgia') AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL) AND (1=1) ORDER BY posts.created_at DESC LIMIT 1`, [], `SELECT posts.id, posts.title, posts.created_at, posts.type, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM posts JOIN users ON users.id = posts.author_user_id WHERE posts.type IN ('art', 'nostalgia') AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL) ORDER BY posts.created_at DESC LIMIT 1`, []),
      safeFirstNull(db, `SELECT post_comments.created_at, posts.id AS post_id, posts.title AS post_title, posts.type AS post_type, comment_users.username AS comment_author, comment_users.preferred_username_color_index AS comment_author_color_preference, post_users.username AS post_author, post_users.preferred_username_color_index AS post_author_color_preference FROM post_comments JOIN posts ON posts.id = post_comments.post_id JOIN users AS comment_users ON comment_users.id = post_comments.author_user_id JOIN users AS post_users ON post_users.id = posts.author_user_id WHERE posts.type IN ('art', 'nostalgia') AND (1=1) AND (post_comments.is_deleted = 0 OR post_comments.is_deleted IS NULL) AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL) ORDER BY post_comments.created_at DESC LIMIT 1`),
      safeFirst(db, `SELECT COUNT(*) as count FROM posts WHERE type IN ('bugs', 'rant') AND (is_deleted = 0 OR is_deleted IS NULL) AND (1=1)`, [], 'SELECT COUNT(*) as count FROM posts WHERE type IN (\'bugs\', \'rant\') AND (is_deleted = 0 OR is_deleted IS NULL)', []),
      safeFirst(db, `SELECT posts.id, posts.title, posts.created_at, posts.type, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM posts JOIN users ON users.id = posts.author_user_id WHERE posts.type IN ('bugs', 'rant') AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL) AND (1=1) ORDER BY posts.created_at DESC LIMIT 1`, [], `SELECT posts.id, posts.title, posts.created_at, posts.type, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM posts JOIN users ON users.id = posts.author_user_id WHERE posts.type IN ('bugs', 'rant') AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL) ORDER BY posts.created_at DESC LIMIT 1`, []),
      safeFirstNull(db, `SELECT post_comments.created_at, posts.id AS post_id, posts.title AS post_title, posts.type AS post_type, comment_users.username AS comment_author, comment_users.preferred_username_color_index AS comment_author_color_preference, post_users.username AS post_author, post_users.preferred_username_color_index AS post_author_color_preference FROM post_comments JOIN posts ON posts.id = post_comments.post_id JOIN users AS comment_users ON comment_users.id = post_comments.author_user_id JOIN users AS post_users ON post_users.id = posts.author_user_id WHERE posts.type IN ('bugs', 'rant') AND (1=1) AND (post_comments.is_deleted = 0 OR post_comments.is_deleted IS NULL) AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL) ORDER BY post_comments.created_at DESC LIMIT 1`),
      safeFirst(db, 'SELECT COUNT(*) as count FROM dev_logs WHERE (is_deleted = 0 OR is_deleted IS NULL)', [], 'SELECT COUNT(*) as count FROM dev_logs WHERE (is_deleted = 0 OR is_deleted IS NULL)', []),
      safeFirst(db, `SELECT dev_logs.id, dev_logs.title, dev_logs.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM dev_logs JOIN users ON users.id = dev_logs.author_user_id WHERE (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL) ORDER BY dev_logs.created_at DESC LIMIT 1`, [], `SELECT dev_logs.id, dev_logs.title, dev_logs.created_at, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM dev_logs JOIN users ON users.id = dev_logs.author_user_id WHERE (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL) ORDER BY dev_logs.created_at DESC LIMIT 1`, []),
      safeFirstNull(db, `SELECT dev_log_comments.created_at, dev_logs.id AS log_id, dev_logs.title AS log_title, comment_users.username AS comment_author, comment_users.preferred_username_color_index AS comment_author_color_preference, log_users.username AS log_author, log_users.preferred_username_color_index AS log_author_color_preference FROM dev_log_comments JOIN dev_logs ON dev_logs.id = dev_log_comments.log_id JOIN users AS comment_users ON comment_users.id = dev_log_comments.author_user_id JOIN users AS log_users ON log_users.id = dev_logs.author_user_id WHERE (dev_log_comments.is_deleted = 0 OR dev_log_comments.is_deleted IS NULL) AND (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL) ORDER BY dev_log_comments.created_at DESC LIMIT 1`),
      safeFirst(db, 'SELECT COUNT(*) as count FROM posts WHERE type IN (\'lore\', \'memories\') AND (is_deleted = 0 OR is_deleted IS NULL)', [], 'SELECT COUNT(*) as count FROM posts WHERE type IN (\'lore\', \'memories\') AND (is_deleted = 0 OR is_deleted IS NULL)', []),
      safeFirst(db, `SELECT posts.id, posts.title, posts.created_at, posts.type, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM posts JOIN users ON users.id = posts.author_user_id WHERE posts.type IN ('lore', 'memories') AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL) ORDER BY posts.created_at DESC LIMIT 1`, [], `SELECT posts.id, posts.title, posts.created_at, posts.type, users.username AS author_name, users.preferred_username_color_index AS author_color_preference FROM posts JOIN users ON users.id = posts.author_user_id WHERE posts.type IN ('lore', 'memories') AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL) ORDER BY posts.created_at DESC LIMIT 1`, []),
      safeFirstNull(db, `SELECT post_comments.created_at, posts.id AS post_id, posts.title AS post_title, posts.type AS post_type, comment_users.username AS comment_author, comment_users.preferred_username_color_index AS comment_author_color_preference, post_users.username AS post_author, post_users.preferred_username_color_index AS post_author_color_preference FROM post_comments JOIN posts ON posts.id = post_comments.post_id JOIN users AS comment_users ON comment_users.id = post_comments.author_user_id JOIN users AS post_users ON post_users.id = posts.author_user_id WHERE posts.type IN ('lore', 'memories') AND (post_comments.is_deleted = 0 OR post_comments.is_deleted IS NULL) AND (posts.is_deleted = 0 OR posts.is_deleted IS NULL) ORDER BY post_comments.created_at DESC LIMIT 1`)
    ]);

    const [
      timelineCount, timelineRecent, forumCount, forumRecentPost, forumRecentReply,
      eventsCount, eventsRecentPost, eventsRecentComment,
      musicCount, musicRecentPost, musicRecentComment,
      projectsCount, projectsRecentPost, projectsRecentReply,
      shitpostsCount, shitpostsRecent,
      artNostalgiaCount, artNostalgiaRecentPost, artNostalgiaRecentComment,
      bugsRantCount, bugsRantRecentPost, bugsRantRecentComment,
      devlogCount, devlogRecentPost, devlogRecentComment,
      loreMemoriesCount, loreMemoriesRecentPost, loreMemoriesRecentComment
    ] = results;

    // Derive forumRecent from post + reply
    let forumRecent = null;
    if (forumRecentPost && forumRecentReply) {
      if (forumRecentReply.created_at > forumRecentPost.created_at) {
        forumRecent = {
          type: 'reply',
          postId: forumRecentReply.thread_id,
          postTitle: forumRecentReply.thread_title,
          postAuthor: forumRecentReply.thread_author,
          postAuthorColorPreference: forumRecentReply.thread_author_color_preference !== null && forumRecentReply.thread_author_color_preference !== undefined ? Number(forumRecentReply.thread_author_color_preference) : null,
          activityAuthor: forumRecentReply.reply_author,
          activityAuthorColorPreference: forumRecentReply.reply_author_color_preference !== null && forumRecentReply.reply_author_color_preference !== undefined ? Number(forumRecentReply.reply_author_color_preference) : null,
          createdAt: forumRecentReply.created_at,
          href: `/lobby/${forumRecentReply.thread_id}`
        };
      } else {
        forumRecent = {
          type: 'post',
          postId: forumRecentPost.id,
          postTitle: forumRecentPost.title,
          postAuthor: forumRecentPost.author_name,
          postAuthorColorPreference: forumRecentPost.author_color_preference !== null && forumRecentPost.author_color_preference !== undefined ? Number(forumRecentPost.author_color_preference) : null,
          activityAuthor: forumRecentPost.author_name,
          activityAuthorColorPreference: forumRecentPost.author_color_preference !== null && forumRecentPost.author_color_preference !== undefined ? Number(forumRecentPost.author_color_preference) : null,
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

    let eventsRecent = null;
    if (eventsRecentPost && eventsRecentComment) {
      if (eventsRecentComment.created_at > eventsRecentPost.created_at) {
        eventsRecent = {
          type: 'comment',
          postId: eventsRecentComment.event_id,
          postTitle: eventsRecentComment.event_title,
          postAuthor: eventsRecentComment.event_author,
          postAuthorColorPreference: eventsRecentComment.event_author_color_preference !== null && eventsRecentComment.event_author_color_preference !== undefined ? Number(eventsRecentComment.event_author_color_preference) : null,
          activityAuthor: eventsRecentComment.comment_author,
          activityAuthorColorPreference: eventsRecentComment.comment_author_color_preference !== null && eventsRecentComment.comment_author_color_preference !== undefined ? Number(eventsRecentComment.comment_author_color_preference) : null,
          createdAt: eventsRecentComment.created_at,
          href: `/events/${eventsRecentComment.event_id}`
        };
      } else {
        eventsRecent = {
          type: 'post',
          postId: eventsRecentPost.id,
          postTitle: eventsRecentPost.title,
          postAuthor: eventsRecentPost.author_name,
          postAuthorColorPreference: eventsRecentPost.author_color_preference !== null && eventsRecentPost.author_color_preference !== undefined ? Number(eventsRecentPost.author_color_preference) : null,
          activityAuthor: eventsRecentPost.author_name,
          activityAuthorColorPreference: eventsRecentPost.author_color_preference !== null && eventsRecentPost.author_color_preference !== undefined ? Number(eventsRecentPost.author_color_preference) : null,
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
        postAuthorColorPreference: eventsRecentPost.author_color_preference !== null && eventsRecentPost.author_color_preference !== undefined ? Number(eventsRecentPost.author_color_preference) : null,
        activityAuthor: eventsRecentPost.author_name,
        activityAuthorColorPreference: eventsRecentPost.author_color_preference !== null && eventsRecentPost.author_color_preference !== undefined ? Number(eventsRecentPost.author_color_preference) : null,
        createdAt: eventsRecentPost.created_at,
        href: `/events/${eventsRecentPost.id}`
      };
    } else if (eventsRecentComment) {
      eventsRecent = {
        type: 'comment',
        postId: eventsRecentComment.event_id,
        postTitle: eventsRecentComment.event_title,
        postAuthor: eventsRecentComment.event_author,
        postAuthorColorPreference: eventsRecentComment.event_author_color_preference !== null && eventsRecentComment.event_author_color_preference !== undefined ? Number(eventsRecentComment.event_author_color_preference) : null,
        activityAuthor: eventsRecentComment.comment_author,
        activityAuthorColorPreference: eventsRecentComment.comment_author_color_preference !== null && eventsRecentComment.comment_author_color_preference !== undefined ? Number(eventsRecentComment.comment_author_color_preference) : null,
        createdAt: eventsRecentComment.created_at,
        href: `/events/${eventsRecentComment.event_id}`
      };
    }

    let musicRecent = null;
    if (musicRecentPost && musicRecentComment) {
      if (musicRecentComment.created_at > musicRecentPost.created_at) {
        musicRecent = {
          type: 'comment',
          postId: musicRecentComment.post_id,
          postTitle: musicRecentComment.post_title,
          postAuthor: musicRecentComment.post_author,
          postAuthorColorPreference: musicRecentComment.post_author_color_preference !== null && musicRecentComment.post_author_color_preference !== undefined ? Number(musicRecentComment.post_author_color_preference) : null,
          activityAuthor: musicRecentComment.comment_author,
          activityAuthorColorPreference: musicRecentComment.comment_author_color_preference !== null && musicRecentComment.comment_author_color_preference !== undefined ? Number(musicRecentComment.comment_author_color_preference) : null,
          createdAt: musicRecentComment.created_at,
          href: `/music/${musicRecentComment.post_id}`
        };
      } else {
        musicRecent = {
          type: 'post',
          postId: musicRecentPost.id,
          postTitle: musicRecentPost.title,
          postAuthor: musicRecentPost.author_name,
          postAuthorColorPreference: musicRecentPost.author_color_preference !== null && musicRecentPost.author_color_preference !== undefined ? Number(musicRecentPost.author_color_preference) : null,
          activityAuthor: musicRecentPost.author_name,
          activityAuthorColorPreference: musicRecentPost.author_color_preference !== null && musicRecentPost.author_color_preference !== undefined ? Number(musicRecentPost.author_color_preference) : null,
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
        postAuthorColorPreference: musicRecentPost.author_color_preference !== null && musicRecentPost.author_color_preference !== undefined ? Number(musicRecentPost.author_color_preference) : null,
        activityAuthor: musicRecentPost.author_name,
        activityAuthorColorPreference: musicRecentPost.author_color_preference !== null && musicRecentPost.author_color_preference !== undefined ? Number(musicRecentPost.author_color_preference) : null,
        createdAt: musicRecentPost.created_at,
        href: `/music/${musicRecentPost.id}`
      };
    } else if (musicRecentComment) {
      musicRecent = {
        type: 'comment',
        postId: musicRecentComment.post_id,
        postTitle: musicRecentComment.post_title,
        postAuthor: musicRecentComment.post_author,
        postAuthorColorPreference: musicRecentComment.post_author_color_preference !== null && musicRecentComment.post_author_color_preference !== undefined ? Number(musicRecentComment.post_author_color_preference) : null,
        activityAuthor: musicRecentComment.comment_author,
        activityAuthorColorPreference: musicRecentComment.comment_author_color_preference !== null && musicRecentComment.comment_author_color_preference !== undefined ? Number(musicRecentComment.comment_author_color_preference) : null,
        createdAt: musicRecentComment.created_at,
        href: `/music/${musicRecentComment.post_id}`
      };
    }

    let projectsRecent = null;
    if (projectsRecentPost && projectsRecentReply) {
      if (projectsRecentReply.created_at > projectsRecentPost.created_at) {
        projectsRecent = {
          type: 'reply',
          postId: projectsRecentReply.project_id,
          postTitle: projectsRecentReply.project_title,
          postAuthor: projectsRecentReply.project_author,
          postAuthorColorPreference: projectsRecentReply.project_author_color_preference !== null && projectsRecentReply.project_author_color_preference !== undefined ? Number(projectsRecentReply.project_author_color_preference) : null,
          activityAuthor: projectsRecentReply.reply_author,
          activityAuthorColorPreference: projectsRecentReply.reply_author_color_preference !== null && projectsRecentReply.reply_author_color_preference !== undefined ? Number(projectsRecentReply.reply_author_color_preference) : null,
          createdAt: projectsRecentReply.created_at,
          href: `/projects/${projectsRecentReply.project_id}`
        };
      } else {
        projectsRecent = {
          type: 'post',
          postId: projectsRecentPost.id,
          postTitle: projectsRecentPost.title,
          postAuthor: projectsRecentPost.author_name,
          postAuthorColorPreference: projectsRecentPost.author_color_preference !== null && projectsRecentPost.author_color_preference !== undefined ? Number(projectsRecentPost.author_color_preference) : null,
          activityAuthor: projectsRecentPost.author_name,
          activityAuthorColorPreference: projectsRecentPost.author_color_preference !== null && projectsRecentPost.author_color_preference !== undefined ? Number(projectsRecentPost.author_color_preference) : null,
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
        postAuthorColorPreference: projectsRecentPost.author_color_preference !== null && projectsRecentPost.author_color_preference !== undefined ? Number(projectsRecentPost.author_color_preference) : null,
        activityAuthor: projectsRecentPost.author_name,
        activityAuthorColorPreference: projectsRecentPost.author_color_preference !== null && projectsRecentPost.author_color_preference !== undefined ? Number(projectsRecentPost.author_color_preference) : null,
        createdAt: projectsRecentPost.created_at,
        href: `/projects/${projectsRecentPost.id}`
      };
    } else if (projectsRecentReply) {
      projectsRecent = {
        type: 'reply',
        postId: projectsRecentReply.project_id,
        postTitle: projectsRecentReply.project_title,
        postAuthor: projectsRecentReply.project_author,
        postAuthorColorPreference: projectsRecentReply.project_author_color_preference !== null && projectsRecentReply.project_author_color_preference !== undefined ? Number(projectsRecentReply.project_author_color_preference) : null,
        activityAuthor: projectsRecentReply.reply_author,
        activityAuthorColorPreference: projectsRecentReply.reply_author_color_preference !== null && projectsRecentReply.reply_author_color_preference !== undefined ? Number(projectsRecentReply.reply_author_color_preference) : null,
        createdAt: projectsRecentReply.created_at,
        href: `/projects/${projectsRecentReply.project_id}`
      };
    }

    let artNostalgiaRecent = null;
    if (artNostalgiaRecentPost && artNostalgiaRecentComment) {
      if (artNostalgiaRecentComment.created_at > artNostalgiaRecentPost.created_at) {
        artNostalgiaRecent = { type: 'comment', postId: artNostalgiaRecentComment.post_id, postTitle: artNostalgiaRecentComment.post_title, postAuthor: artNostalgiaRecentComment.post_author, postAuthorColorPreference: artNostalgiaRecentComment.post_author_color_preference != null ? Number(artNostalgiaRecentComment.post_author_color_preference) : null, activityAuthor: artNostalgiaRecentComment.comment_author, activityAuthorColorPreference: artNostalgiaRecentComment.comment_author_color_preference != null ? Number(artNostalgiaRecentComment.comment_author_color_preference) : null, createdAt: artNostalgiaRecentComment.created_at, href: `/${artNostalgiaRecentComment.post_type}/${artNostalgiaRecentComment.post_id}` };
      } else {
        artNostalgiaRecent = { type: 'post', postId: artNostalgiaRecentPost.id, postTitle: artNostalgiaRecentPost.title, postAuthor: artNostalgiaRecentPost.author_name, postAuthorColorPreference: artNostalgiaRecentPost.author_color_preference != null ? Number(artNostalgiaRecentPost.author_color_preference) : null, activityAuthor: artNostalgiaRecentPost.author_name, activityAuthorColorPreference: artNostalgiaRecentPost.author_color_preference != null ? Number(artNostalgiaRecentPost.author_color_preference) : null, createdAt: artNostalgiaRecentPost.created_at, href: `/${artNostalgiaRecentPost.type}/${artNostalgiaRecentPost.id}` };
      }
    } else if (artNostalgiaRecentPost) {
      artNostalgiaRecent = { type: 'post', postId: artNostalgiaRecentPost.id, postTitle: artNostalgiaRecentPost.title, postAuthor: artNostalgiaRecentPost.author_name, postAuthorColorPreference: artNostalgiaRecentPost.author_color_preference != null ? Number(artNostalgiaRecentPost.author_color_preference) : null, activityAuthor: artNostalgiaRecentPost.author_name, activityAuthorColorPreference: artNostalgiaRecentPost.author_color_preference != null ? Number(artNostalgiaRecentPost.author_color_preference) : null, createdAt: artNostalgiaRecentPost.created_at, href: `/${artNostalgiaRecentPost.type}/${artNostalgiaRecentPost.id}` };
    } else if (artNostalgiaRecentComment) {
      artNostalgiaRecent = { type: 'comment', postId: artNostalgiaRecentComment.post_id, postTitle: artNostalgiaRecentComment.post_title, postAuthor: artNostalgiaRecentComment.post_author, postAuthorColorPreference: artNostalgiaRecentComment.post_author_color_preference != null ? Number(artNostalgiaRecentComment.post_author_color_preference) : null, activityAuthor: artNostalgiaRecentComment.comment_author, activityAuthorColorPreference: artNostalgiaRecentComment.comment_author_color_preference != null ? Number(artNostalgiaRecentComment.comment_author_color_preference) : null, createdAt: artNostalgiaRecentComment.created_at, href: `/${artNostalgiaRecentComment.post_type}/${artNostalgiaRecentComment.post_id}` };
    }

    let bugsRantRecent = null;
    if (bugsRantRecentPost && bugsRantRecentComment) {
      if (bugsRantRecentComment.created_at > bugsRantRecentPost.created_at) {
        bugsRantRecent = { type: 'comment', postId: bugsRantRecentComment.post_id, postTitle: bugsRantRecentComment.post_title, postAuthor: bugsRantRecentComment.post_author, postAuthorColorPreference: bugsRantRecentComment.post_author_color_preference != null ? Number(bugsRantRecentComment.post_author_color_preference) : null, activityAuthor: bugsRantRecentComment.comment_author, activityAuthorColorPreference: bugsRantRecentComment.comment_author_color_preference != null ? Number(bugsRantRecentComment.comment_author_color_preference) : null, createdAt: bugsRantRecentComment.created_at, href: `/${bugsRantRecentComment.post_type}/${bugsRantRecentComment.post_id}` };
      } else {
        bugsRantRecent = { type: 'post', postId: bugsRantRecentPost.id, postTitle: bugsRantRecentPost.title, postAuthor: bugsRantRecentPost.author_name, postAuthorColorPreference: bugsRantRecentPost.author_color_preference != null ? Number(bugsRantRecentPost.author_color_preference) : null, activityAuthor: bugsRantRecentPost.author_name, activityAuthorColorPreference: bugsRantRecentPost.author_color_preference != null ? Number(bugsRantRecentPost.author_color_preference) : null, createdAt: bugsRantRecentPost.created_at, href: `/${bugsRantRecentPost.type}/${bugsRantRecentPost.id}` };
      }
    } else if (bugsRantRecentPost) {
      bugsRantRecent = { type: 'post', postId: bugsRantRecentPost.id, postTitle: bugsRantRecentPost.title, postAuthor: bugsRantRecentPost.author_name, postAuthorColorPreference: bugsRantRecentPost.author_color_preference != null ? Number(bugsRantRecentPost.author_color_preference) : null, activityAuthor: bugsRantRecentPost.author_name, activityAuthorColorPreference: bugsRantRecentPost.author_color_preference != null ? Number(bugsRantRecentPost.author_color_preference) : null, createdAt: bugsRantRecentPost.created_at, href: `/${bugsRantRecentPost.type}/${bugsRantRecentPost.id}` };
    } else if (bugsRantRecentComment) {
      bugsRantRecent = { type: 'comment', postId: bugsRantRecentComment.post_id, postTitle: bugsRantRecentComment.post_title, postAuthor: bugsRantRecentComment.post_author, postAuthorColorPreference: bugsRantRecentComment.post_author_color_preference != null ? Number(bugsRantRecentComment.post_author_color_preference) : null, activityAuthor: bugsRantRecentComment.comment_author, activityAuthorColorPreference: bugsRantRecentComment.comment_author_color_preference != null ? Number(bugsRantRecentComment.comment_author_color_preference) : null, createdAt: bugsRantRecentComment.created_at, href: `/${bugsRantRecentComment.post_type}/${bugsRantRecentComment.post_id}` };
    }

    let devlogRecent = null;
    if (devlogRecentPost && devlogRecentComment) {
          if (devlogRecentComment.created_at > devlogRecentPost.created_at) {
            devlogRecent = {
              type: 'comment',
              postId: devlogRecentComment.log_id,
              postTitle: devlogRecentComment.log_title,
              postAuthor: devlogRecentComment.log_author,
              postAuthorColorPreference: devlogRecentComment.log_author_color_preference !== null && devlogRecentComment.log_author_color_preference !== undefined ? Number(devlogRecentComment.log_author_color_preference) : null,
              activityAuthor: devlogRecentComment.comment_author,
              activityAuthorColorPreference: devlogRecentComment.comment_author_color_preference !== null && devlogRecentComment.comment_author_color_preference !== undefined ? Number(devlogRecentComment.comment_author_color_preference) : null,
              createdAt: devlogRecentComment.created_at,
              href: `/devlog/${devlogRecentComment.log_id}`
            };
          } else {
            devlogRecent = {
              type: 'post',
              postId: devlogRecentPost.id,
              postTitle: devlogRecentPost.title,
              postAuthor: devlogRecentPost.author_name,
              postAuthorColorPreference: devlogRecentPost.author_color_preference !== null && devlogRecentPost.author_color_preference !== undefined ? Number(devlogRecentPost.author_color_preference) : null,
              activityAuthor: devlogRecentPost.author_name,
              activityAuthorColorPreference: devlogRecentPost.author_color_preference !== null && devlogRecentPost.author_color_preference !== undefined ? Number(devlogRecentPost.author_color_preference) : null,
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
            postAuthorColorPreference: devlogRecentPost.author_color_preference !== null && devlogRecentPost.author_color_preference !== undefined ? Number(devlogRecentPost.author_color_preference) : null,
            activityAuthor: devlogRecentPost.author_name,
            activityAuthorColorPreference: devlogRecentPost.author_color_preference !== null && devlogRecentPost.author_color_preference !== undefined ? Number(devlogRecentPost.author_color_preference) : null,
            createdAt: devlogRecentPost.created_at,
            href: `/devlog/${devlogRecentPost.id}`
          };
        } else if (devlogRecentComment) {
          devlogRecent = {
            type: 'comment',
            postId: devlogRecentComment.log_id,
            postTitle: devlogRecentComment.log_title,
            postAuthor: devlogRecentComment.log_author,
            postAuthorColorPreference: devlogRecentComment.log_author_color_preference !== null && devlogRecentComment.log_author_color_preference !== undefined ? Number(devlogRecentComment.log_author_color_preference) : null,
            activityAuthor: devlogRecentComment.comment_author,
            activityAuthorColorPreference: devlogRecentComment.comment_author_color_preference !== null && devlogRecentComment.comment_author_color_preference !== undefined ? Number(devlogRecentComment.comment_author_color_preference) : null,
            createdAt: devlogRecentComment.created_at,
            href: `/devlog/${devlogRecentComment.log_id}`
          };
        }

    let loreMemoriesRecent = null;
    if (loreMemoriesRecentPost && loreMemoriesRecentComment) {
      if (loreMemoriesRecentComment.created_at > loreMemoriesRecentPost.created_at) {
        loreMemoriesRecent = {
              type: 'comment',
              postId: loreMemoriesRecentComment.post_id,
              postTitle: loreMemoriesRecentComment.post_title,
              postAuthor: loreMemoriesRecentComment.post_author,
              postAuthorColorPreference: loreMemoriesRecentComment.post_author_color_preference !== null && loreMemoriesRecentComment.post_author_color_preference !== undefined ? Number(loreMemoriesRecentComment.post_author_color_preference) : null,
              activityAuthor: loreMemoriesRecentComment.comment_author,
              activityAuthorColorPreference: loreMemoriesRecentComment.comment_author_color_preference !== null && loreMemoriesRecentComment.comment_author_color_preference !== undefined ? Number(loreMemoriesRecentComment.comment_author_color_preference) : null,
              createdAt: loreMemoriesRecentComment.created_at,
              href: `/lore-memories/${loreMemoriesRecentComment.post_id}`
            };
      } else {
        loreMemoriesRecent = {
              type: 'post',
              postId: loreMemoriesRecentPost.id,
              postTitle: loreMemoriesRecentPost.title,
              postAuthor: loreMemoriesRecentPost.author_name,
              postAuthorColorPreference: loreMemoriesRecentPost.author_color_preference !== null && loreMemoriesRecentPost.author_color_preference !== undefined ? Number(loreMemoriesRecentPost.author_color_preference) : null,
              activityAuthor: loreMemoriesRecentPost.author_name,
              activityAuthorColorPreference: loreMemoriesRecentPost.author_color_preference !== null && loreMemoriesRecentPost.author_color_preference !== undefined ? Number(loreMemoriesRecentPost.author_color_preference) : null,
              createdAt: loreMemoriesRecentPost.created_at,
              href: `/lore-memories/${loreMemoriesRecentPost.id}`
            };
      }
    } else if (loreMemoriesRecentPost) {
          loreMemoriesRecent = {
            type: 'post',
            postId: loreMemoriesRecentPost.id,
            postTitle: loreMemoriesRecentPost.title,
            postAuthor: loreMemoriesRecentPost.author_name,
            postAuthorColorPreference: loreMemoriesRecentPost.author_color_preference !== null && loreMemoriesRecentPost.author_color_preference !== undefined ? Number(loreMemoriesRecentPost.author_color_preference) : null,
            activityAuthor: loreMemoriesRecentPost.author_name,
            activityAuthorColorPreference: loreMemoriesRecentPost.author_color_preference !== null && loreMemoriesRecentPost.author_color_preference !== undefined ? Number(loreMemoriesRecentPost.author_color_preference) : null,
            createdAt: loreMemoriesRecentPost.created_at,
            href: `/lore-memories/${loreMemoriesRecentPost.id}`
          };
        } else if (loreMemoriesRecentComment) {
          loreMemoriesRecent = {
            type: 'comment',
            postId: loreMemoriesRecentComment.post_id,
            postTitle: loreMemoriesRecentComment.post_title,
            postAuthor: loreMemoriesRecentComment.post_author,
            postAuthorColorPreference: loreMemoriesRecentComment.post_author_color_preference !== null && loreMemoriesRecentComment.post_author_color_preference !== undefined ? Number(loreMemoriesRecentComment.post_author_color_preference) : null,
            activityAuthor: loreMemoriesRecentComment.comment_author,
            activityAuthorColorPreference: loreMemoriesRecentComment.comment_author_color_preference !== null && loreMemoriesRecentComment.comment_author_color_preference !== undefined ? Number(loreMemoriesRecentComment.comment_author_color_preference) : null,
            createdAt: loreMemoriesRecentComment.created_at,
            href: `/lore-memories/${loreMemoriesRecentComment.post_id}`
          };
        }

    sectionData = {
      timeline: {
        count: timelineCount?.count || 0,
        recent: timelineRecent
          ? {
              id: timelineRecent.id,
              title: timelineRecent.title,
              author: timelineRecent.author_name,
              authorColorPreference: timelineRecent.author_color_preference !== null && timelineRecent.author_color_preference !== undefined ? Number(timelineRecent.author_color_preference) : null,
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
              postAuthorColorPreference: forumRecent.postAuthorColorPreference,
              activityAuthor: forumRecent.activityAuthor,
              activityAuthorColorPreference: forumRecent.activityAuthorColorPreference,
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
              postAuthorColorPreference: eventsRecent.postAuthorColorPreference,
              activityAuthor: eventsRecent.activityAuthor,
              activityAuthorColorPreference: eventsRecent.activityAuthorColorPreference,
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
              postAuthorColorPreference: musicRecent.postAuthorColorPreference,
              activityAuthor: musicRecent.activityAuthor,
              activityAuthorColorPreference: musicRecent.activityAuthorColorPreference,
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
              postAuthorColorPreference: projectsRecent.postAuthorColorPreference,
              activityAuthor: projectsRecent.activityAuthor,
              activityAuthorColorPreference: projectsRecent.activityAuthorColorPreference,
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
              authorColorPreference: shitpostsRecent.author_color_preference !== null && shitpostsRecent.author_color_preference !== undefined ? Number(shitpostsRecent.author_color_preference) : null,
              timeAgo: formatTimeAgo(shitpostsRecent.created_at),
              url: `/lobby/${shitpostsRecent.id}`
            }
          : null
      },
      artNostalgia: {
        count: artNostalgiaCount?.count || 0,
        recent: artNostalgiaRecent
          ? {
              type: artNostalgiaRecent.type,
              postId: artNostalgiaRecent.postId,
              postTitle: artNostalgiaRecent.postTitle || 'Untitled',
              postAuthor: artNostalgiaRecent.postAuthor,
              postAuthorColorPreference: artNostalgiaRecent.postAuthorColorPreference,
              activityAuthor: artNostalgiaRecent.activityAuthor,
              activityAuthorColorPreference: artNostalgiaRecent.activityAuthorColorPreference,
              timeAgo: formatTimeAgo(artNostalgiaRecent.createdAt),
              href: artNostalgiaRecent.href
            }
          : null
      },
      bugsRant: {
        count: bugsRantCount?.count || 0,
        recent: bugsRantRecent
          ? {
              type: bugsRantRecent.type,
              postId: bugsRantRecent.postId,
              postTitle: bugsRantRecent.postTitle || 'Untitled',
              postAuthor: bugsRantRecent.postAuthor,
              postAuthorColorPreference: bugsRantRecent.postAuthorColorPreference,
              activityAuthor: bugsRantRecent.activityAuthor,
              activityAuthorColorPreference: bugsRantRecent.activityAuthorColorPreference,
              timeAgo: formatTimeAgo(bugsRantRecent.createdAt),
              href: bugsRantRecent.href
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
              postAuthorColorPreference: devlogRecent.postAuthorColorPreference,
              activityAuthor: devlogRecent.activityAuthor,
              activityAuthorColorPreference: devlogRecent.activityAuthorColorPreference,
              timeAgo: formatTimeAgo(devlogRecent.createdAt),
              href: devlogRecent.href
            }
          : null
      } : null,
      loreMemories: hasUsername && loreMemoriesCount !== null ? {
        count: loreMemoriesCount?.count || 0,
        recent: loreMemoriesRecent
          ? {
              type: loreMemoriesRecent.type,
              postId: loreMemoriesRecent.postId,
              postTitle: loreMemoriesRecent.postTitle || 'Untitled',
              postAuthor: loreMemoriesRecent.postAuthor,
              postAuthorColorPreference: loreMemoriesRecent.postAuthorColorPreference,
              activityAuthor: loreMemoriesRecent.activityAuthor,
              activityAuthorColorPreference: loreMemoriesRecent.activityAuthorColorPreference,
              timeAgo: formatTimeAgo(loreMemoriesRecent.createdAt),
              href: loreMemoriesRecent.href
            }
          : null
      } : null
  };
}

  // Collect all usernames from sectionData
  const allUsernames = [];
  
  // Collect usernames from sectionData
  if (sectionData) {
    // Timeline
    if (sectionData.timeline?.recent?.author) {
      allUsernames.push(sectionData.timeline.recent.author);
    }
    // Forum
    if (sectionData.forum?.recent) {
      if (sectionData.forum.recent.postAuthor) allUsernames.push(sectionData.forum.recent.postAuthor);
      if (sectionData.forum.recent.activityAuthor) allUsernames.push(sectionData.forum.recent.activityAuthor);
    }
    // Events
    if (sectionData.events?.recent) {
      if (sectionData.events.recent.postAuthor) allUsernames.push(sectionData.events.recent.postAuthor);
      if (sectionData.events.recent.activityAuthor) allUsernames.push(sectionData.events.recent.activityAuthor);
    }
    // Music
    if (sectionData.music?.recent) {
      if (sectionData.music.recent.postAuthor) allUsernames.push(sectionData.music.recent.postAuthor);
      if (sectionData.music.recent.activityAuthor) allUsernames.push(sectionData.music.recent.activityAuthor);
    }
    // Projects
    if (sectionData.projects?.recent) {
      if (sectionData.projects.recent.postAuthor) allUsernames.push(sectionData.projects.recent.postAuthor);
      if (sectionData.projects.recent.activityAuthor) allUsernames.push(sectionData.projects.recent.activityAuthor);
    }
    // Shitposts
    if (sectionData.shitposts?.recent?.author) {
      allUsernames.push(sectionData.shitposts.recent.author);
    }
    // Art & Nostalgia
    if (sectionData.artNostalgia?.recent) {
      if (sectionData.artNostalgia.recent.postAuthor) allUsernames.push(sectionData.artNostalgia.recent.postAuthor);
      if (sectionData.artNostalgia.recent.activityAuthor && sectionData.artNostalgia.recent.activityAuthor !== sectionData.artNostalgia.recent.postAuthor) {
        allUsernames.push(sectionData.artNostalgia.recent.activityAuthor);
      }
    }
    // Bugs & Rant
    if (sectionData.bugsRant?.recent) {
      if (sectionData.bugsRant.recent.postAuthor) allUsernames.push(sectionData.bugsRant.recent.postAuthor);
      if (sectionData.bugsRant.recent.activityAuthor && sectionData.bugsRant.recent.activityAuthor !== sectionData.bugsRant.recent.postAuthor) {
        allUsernames.push(sectionData.bugsRant.recent.activityAuthor);
      }
    }
    // Devlog
    if (sectionData.devlog?.recent) {
      if (sectionData.devlog.recent.postAuthor) allUsernames.push(sectionData.devlog.recent.postAuthor);
      if (sectionData.devlog.recent.activityAuthor) allUsernames.push(sectionData.devlog.recent.activityAuthor);
    }
    // Lore & Memories
    if (sectionData.loreMemories?.recent?.postAuthor) {
      allUsernames.push(sectionData.loreMemories.recent.postAuthor);
    }
    if (sectionData.loreMemories?.recent?.activityAuthor && sectionData.loreMemories.recent.activityAuthor !== sectionData.loreMemories.recent.postAuthor) {
      allUsernames.push(sectionData.loreMemories.recent.activityAuthor);
    }
  }
  
  // Build map of username -> preferred color index
  const preferredColors = new Map();
  
  // From sectionData
  if (sectionData) {
    // Timeline
    if (sectionData.timeline?.recent?.author && sectionData.timeline.recent.authorColorPreference !== null && sectionData.timeline.recent.authorColorPreference !== undefined) {
      preferredColors.set(sectionData.timeline.recent.author, Number(sectionData.timeline.recent.authorColorPreference));
    }
    // Forum
    if (sectionData.forum?.recent) {
      if (sectionData.forum.recent.postAuthor && sectionData.forum.recent.postAuthorColorPreference !== null && sectionData.forum.recent.postAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.forum.recent.postAuthor, Number(sectionData.forum.recent.postAuthorColorPreference));
      }
      if (sectionData.forum.recent.activityAuthor && sectionData.forum.recent.activityAuthorColorPreference !== null && sectionData.forum.recent.activityAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.forum.recent.activityAuthor, Number(sectionData.forum.recent.activityAuthorColorPreference));
      }
    }
    // Events
    if (sectionData.events?.recent) {
      if (sectionData.events.recent.postAuthor && sectionData.events.recent.postAuthorColorPreference !== null && sectionData.events.recent.postAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.events.recent.postAuthor, Number(sectionData.events.recent.postAuthorColorPreference));
      }
      if (sectionData.events.recent.activityAuthor && sectionData.events.recent.activityAuthorColorPreference !== null && sectionData.events.recent.activityAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.events.recent.activityAuthor, Number(sectionData.events.recent.activityAuthorColorPreference));
      }
    }
    // Music
    if (sectionData.music?.recent) {
      if (sectionData.music.recent.postAuthor && sectionData.music.recent.postAuthorColorPreference !== null && sectionData.music.recent.postAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.music.recent.postAuthor, Number(sectionData.music.recent.postAuthorColorPreference));
      }
      if (sectionData.music.recent.activityAuthor && sectionData.music.recent.activityAuthorColorPreference !== null && sectionData.music.recent.activityAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.music.recent.activityAuthor, Number(sectionData.music.recent.activityAuthorColorPreference));
      }
    }
    // Projects
    if (sectionData.projects?.recent) {
      if (sectionData.projects.recent.postAuthor && sectionData.projects.recent.postAuthorColorPreference !== null && sectionData.projects.recent.postAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.projects.recent.postAuthor, Number(sectionData.projects.recent.postAuthorColorPreference));
      }
      if (sectionData.projects.recent.activityAuthor && sectionData.projects.recent.activityAuthorColorPreference !== null && sectionData.projects.recent.activityAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.projects.recent.activityAuthor, Number(sectionData.projects.recent.activityAuthorColorPreference));
      }
    }
    // Shitposts
    if (sectionData.shitposts?.recent?.author && sectionData.shitposts.recent.authorColorPreference !== null && sectionData.shitposts.recent.authorColorPreference !== undefined) {
      preferredColors.set(sectionData.shitposts.recent.author, Number(sectionData.shitposts.recent.authorColorPreference));
    }
    // Art & Nostalgia
    if (sectionData.artNostalgia?.recent) {
      if (sectionData.artNostalgia.recent.postAuthor && sectionData.artNostalgia.recent.postAuthorColorPreference != null) {
        preferredColors.set(sectionData.artNostalgia.recent.postAuthor, Number(sectionData.artNostalgia.recent.postAuthorColorPreference));
      }
      if (sectionData.artNostalgia.recent.activityAuthor && sectionData.artNostalgia.recent.activityAuthorColorPreference != null) {
        preferredColors.set(sectionData.artNostalgia.recent.activityAuthor, Number(sectionData.artNostalgia.recent.activityAuthorColorPreference));
      }
    }
    // Bugs & Rant
    if (sectionData.bugsRant?.recent) {
      if (sectionData.bugsRant.recent.postAuthor && sectionData.bugsRant.recent.postAuthorColorPreference != null) {
        preferredColors.set(sectionData.bugsRant.recent.postAuthor, Number(sectionData.bugsRant.recent.postAuthorColorPreference));
      }
      if (sectionData.bugsRant.recent.activityAuthor && sectionData.bugsRant.recent.activityAuthorColorPreference != null) {
        preferredColors.set(sectionData.bugsRant.recent.activityAuthor, Number(sectionData.bugsRant.recent.activityAuthorColorPreference));
      }
    }
    // Devlog
    if (sectionData.devlog?.recent) {
      if (sectionData.devlog.recent.postAuthor && sectionData.devlog.recent.postAuthorColorPreference !== null && sectionData.devlog.recent.postAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.devlog.recent.postAuthor, Number(sectionData.devlog.recent.postAuthorColorPreference));
      }
      if (sectionData.devlog.recent.activityAuthor && sectionData.devlog.recent.activityAuthorColorPreference !== null && sectionData.devlog.recent.activityAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.devlog.recent.activityAuthor, Number(sectionData.devlog.recent.activityAuthorColorPreference));
      }
    }
    // Lore & Memories
    if (sectionData.loreMemories?.recent) {
      if (sectionData.loreMemories.recent.postAuthor && sectionData.loreMemories.recent.postAuthorColorPreference !== null && sectionData.loreMemories.recent.postAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.loreMemories.recent.postAuthor, Number(sectionData.loreMemories.recent.postAuthorColorPreference));
      }
      if (sectionData.loreMemories.recent.activityAuthor && sectionData.loreMemories.recent.activityAuthorColorPreference !== null && sectionData.loreMemories.recent.activityAuthorColorPreference !== undefined) {
        preferredColors.set(sectionData.loreMemories.recent.activityAuthor, Number(sectionData.loreMemories.recent.activityAuthorColorPreference));
      }
    }
  }
  
  const usernameColorMap = assignUniqueColorsForPage([...new Set(allUsernames)], preferredColors);

  // Prepare section cards for alphabetical sorting
  const sections = [
    {
      title: strings.cards.announcements.title,
      description: strings.cards.announcements.description,
      count: sectionData?.timeline?.count || 0,
      recentActivity: sectionData?.timeline?.recent ? {
        type: 'post',
        postTitle: sectionData.timeline.recent.title,
        postAuthor: sectionData.timeline.recent.author,
        postAuthorColorPreference: sectionData.timeline.recent.authorColorPreference,
        activityAuthor: sectionData.timeline.recent.author,
        activityAuthorColorPreference: sectionData.timeline.recent.authorColorPreference,
        timeAgo: sectionData.timeline.recent.timeAgo,
        href: sectionData.timeline.recent.url
      } : null,
      href: "/announcements"
    },
    {
      title: strings.cards.general.title,
      description: strings.cards.general.description,
      count: sectionData?.forum?.count || 0,
      recentActivity: sectionData?.forum?.recent || null,
      href: "/lobby"
    },
    {
      title: strings.cards.events.title,
      description: strings.cards.events.description,
      count: sectionData?.events?.count || 0,
      recentActivity: sectionData?.events?.recent || null,
      href: "/events"
    },
    {
      title: strings.cards.music.title,
      description: strings.cards.music.description,
      count: sectionData?.music?.count || 0,
      recentActivity: sectionData?.music?.recent || null,
      href: "/music"
    },
    {
      title: strings.cards.projects.title,
      description: strings.cards.projects.description,
      count: sectionData?.projects?.count || 0,
      recentActivity: sectionData?.projects?.recent || null,
      href: "/projects"
    },
    {
      title: strings.cards.shitposts.title,
      description: strings.cards.shitposts.description,
      count: sectionData?.shitposts?.count || 0,
      recentActivity: sectionData?.shitposts?.recent ? {
        type: 'post',
        postTitle: sectionData.shitposts.recent.title,
        postAuthor: sectionData.shitposts.recent.author,
        postAuthorColorPreference: sectionData.shitposts.recent.authorColorPreference,
        activityAuthor: sectionData.shitposts.recent.author,
        activityAuthorColorPreference: sectionData.shitposts.recent.authorColorPreference,
        timeAgo: sectionData.shitposts.recent.timeAgo,
        href: sectionData.shitposts.recent.url
      } : null,
      href: "/shitposts"
    }
  ];

  // Add conditional sections
  if (sectionData?.artNostalgia) {
    sections.push({
      title: strings.cards.artNostalgia.title,
      description: strings.cards.artNostalgia.description,
      count: sectionData.artNostalgia.count || 0,
      recentActivity: sectionData.artNostalgia.recent || null,
      href: "/art-nostalgia"
    });
  }

  if (sectionData?.bugsRant) {
    sections.push({
      title: strings.cards.bugsRant.title,
      description: strings.cards.bugsRant.description,
      count: sectionData.bugsRant.count || 0,
      recentActivity: sectionData.bugsRant.recent || null,
      href: "/bugs-rant"
    });
  }

  if (hasUsername && sectionData?.devlog !== null) {
    sections.push({
      title: strings.cards.devlog.title,
      description: strings.cards.devlog.description,
      count: sectionData.devlog?.count || 0,
      recentActivity: sectionData.devlog?.recent || null,
      href: "/devlog"
    });
  }

  if (hasUsername && sectionData?.loreMemories !== null) {
    sections.push({
      title: strings.cards.loreMemories.title,
      description: strings.cards.loreMemories.description,
      count: sectionData.loreMemories.count || 0,
      recentActivity: sectionData.loreMemories.recent || null,
      href: "/lore-memories"
    });
  }

  // Sort sections alphabetically by title
  sections.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="stack">
      {!hasUsername && (
        <ClaimUsernameForm />
      )}

      {hasUsername && (
        <>
          <section className="card">
            <h3 className="section-title" style={{ marginBottom: '16px' }}>Explore Sections</h3>
            <div className="list grid-tiles">
              {sections.map((section) => (
                <HomeSectionCard
                  key={section.href}
                  title={section.title}
                  description={section.description}
                  count={section.count}
                  recentActivity={section.recentActivity}
                  href={section.href}
                  usernameColorMap={usernameColorMap}
                  preferredColors={preferredColors}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
