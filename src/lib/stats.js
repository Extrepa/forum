/**
 * Single source of truth for user stats (thread/reply counts, activity, profile extras).
 * Used by: GET /api/account/stats, profile page, account page.
 * @param {D1Database} db
 * @param {string} userId
 * @param {{ profileViewsDisplay?: number }} [options] - override profile_views (e.g. after increment on profile view)
 * @returns {Promise<StatsShape>}
 */
export async function getStatsForUser(db, userId, options = {}) {
  const empty = {
    threadCount: 0,
    replyCount: 0,
    joinDate: null,
    recentThreads: [],
    recentReplies: [],
    recentActivity: [],
    profileLinks: [],
    profileViews: 0,
    timeSpentMinutes: 0,
    avatarEditMinutes: 0,
    profileMoodText: '',
    profileMoodEmoji: '',
    profileSongUrl: '',
    profileSongProvider: '',
    profileSongAutoplayEnabled: false,
    profileHeadline: '',
    defaultProfileTab: null,
  };

  try {
    const forumThreads = await db.prepare('SELECT COUNT(*) as count FROM forum_threads WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').bind(userId).first();
    const devLogs = await db.prepare('SELECT COUNT(*) as count FROM dev_logs WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').bind(userId).first();
    const musicPosts = await db.prepare('SELECT COUNT(*) as count FROM music_posts WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').bind(userId).first();
    const projects = await db.prepare('SELECT COUNT(*) as count FROM projects WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').bind(userId).first();
    const timelineUpdates = await db.prepare('SELECT COUNT(*) as count FROM timeline_updates WHERE author_user_id = ?').bind(userId).first();
    const events = await db.prepare('SELECT COUNT(*) as count FROM events WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').bind(userId).first();

    let postsCount = 0;
    let postCommentsCount = 0;
    try {
      const postsRows = await db.prepare("SELECT COUNT(*) as count FROM posts WHERE author_user_id = ? AND type IN ('art','bugs','rant','nostalgia','lore','memories') AND (is_deleted = 0 OR is_deleted IS NULL)").bind(userId).first();
      const postCommentsRows = await db.prepare('SELECT COUNT(*) as count FROM post_comments WHERE author_user_id = ? AND is_deleted = 0').bind(userId).first();
      postsCount = postsRows?.count || 0;
      postCommentsCount = postCommentsRows?.count || 0;
    } catch (_) {}

    const threadCount =
      (Number(forumThreads?.count) || 0) +
      (Number(devLogs?.count) || 0) +
      (Number(musicPosts?.count) || 0) +
      (Number(projects?.count) || 0) +
      (Number(timelineUpdates?.count) || 0) +
      (Number(events?.count) || 0) +
      (Number(postsCount) || 0);

    const forumReplies = await db.prepare('SELECT COUNT(*) as count FROM forum_replies WHERE author_user_id = ? AND is_deleted = 0').bind(userId).first();
    const devLogComments = await db.prepare('SELECT COUNT(*) as count FROM dev_log_comments WHERE author_user_id = ? AND is_deleted = 0').bind(userId).first();
    const musicComments = await db.prepare('SELECT COUNT(*) as count FROM music_comments WHERE author_user_id = ? AND is_deleted = 0').bind(userId).first();
    const projectReplies = await db.prepare('SELECT COUNT(*) as count FROM project_replies WHERE author_user_id = ? AND is_deleted = 0').bind(userId).first();
    const timelineComments = await db.prepare('SELECT COUNT(*) as count FROM timeline_comments WHERE author_user_id = ? AND is_deleted = 0').bind(userId).first();
    const eventComments = await db.prepare('SELECT COUNT(*) as count FROM event_comments WHERE author_user_id = ? AND is_deleted = 0').bind(userId).first();

    const replyCount =
      (Number(forumReplies?.count) || 0) +
      (Number(devLogComments?.count) || 0) +
      (Number(musicComments?.count) || 0) +
      (Number(projectReplies?.count) || 0) +
      (Number(timelineComments?.count) || 0) +
      (Number(eventComments?.count) || 0) +
      (Number(postCommentsCount) || 0);

    const recentForumThreads = await db.prepare("SELECT id, title, created_at, 'forum_thread' as post_type FROM forum_threads WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY created_at DESC LIMIT 10").bind(userId).all();
    const recentDevLogs = await db.prepare("SELECT id, title, created_at, 'dev_log' as post_type FROM dev_logs WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY created_at DESC LIMIT 10").bind(userId).all();
    const recentMusicPosts = await db.prepare("SELECT id, title, created_at, 'music_post' as post_type FROM music_posts WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY created_at DESC LIMIT 10").bind(userId).all();
    const recentProjects = await db.prepare("SELECT id, title, created_at, 'project' as post_type FROM projects WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY created_at DESC LIMIT 10").bind(userId).all();
    const recentTimelineUpdates = await db.prepare("SELECT id, title, created_at, 'timeline_update' as post_type FROM timeline_updates WHERE author_user_id = ? ORDER BY created_at DESC LIMIT 10").bind(userId).all();
    const recentEvents = await db.prepare("SELECT id, title, created_at, 'event' as post_type FROM events WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY created_at DESC LIMIT 10").bind(userId).all();

    let recentPostsFromShared = { results: [] };
    try {
      recentPostsFromShared = await db.prepare("SELECT id, title, created_at, type as post_type FROM posts WHERE author_user_id = ? AND type IN ('art','bugs','rant','nostalgia','lore','memories') AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY created_at DESC LIMIT 10").bind(userId).all();
    } catch (_) {}

    const recentForumReplies = await db.prepare("SELECT forum_replies.id, forum_replies.created_at, forum_threads.id as thread_id, forum_threads.title as thread_title, 'forum_reply' as reply_type FROM forum_replies JOIN forum_threads ON forum_threads.id = forum_replies.thread_id WHERE forum_replies.author_user_id = ? AND forum_replies.is_deleted = 0 ORDER BY forum_replies.created_at DESC LIMIT 10").bind(userId).all();
    const recentDevLogComments = await db.prepare("SELECT dev_log_comments.id, dev_log_comments.created_at, dev_logs.id as thread_id, dev_logs.title as thread_title, 'dev_log_comment' as reply_type FROM dev_log_comments JOIN dev_logs ON dev_logs.id = dev_log_comments.log_id WHERE dev_log_comments.author_user_id = ? AND dev_log_comments.is_deleted = 0 ORDER BY dev_log_comments.created_at DESC LIMIT 10").bind(userId).all();
    const recentMusicComments = await db.prepare("SELECT music_comments.id, music_comments.created_at, music_posts.id as thread_id, music_posts.title as thread_title, 'music_comment' as reply_type FROM music_comments JOIN music_posts ON music_posts.id = music_comments.post_id WHERE music_comments.author_user_id = ? AND music_comments.is_deleted = 0 ORDER BY music_comments.created_at DESC LIMIT 10").bind(userId).all();
    const recentProjectReplies = await db.prepare("SELECT project_replies.id, project_replies.created_at, projects.id as thread_id, projects.title as thread_title, 'project_reply' as reply_type FROM project_replies JOIN projects ON projects.id = project_replies.project_id WHERE project_replies.author_user_id = ? AND project_replies.is_deleted = 0 ORDER BY project_replies.created_at DESC LIMIT 10").bind(userId).all();
    const recentTimelineComments = await db.prepare("SELECT timeline_comments.id, timeline_comments.created_at, timeline_updates.id as thread_id, timeline_updates.title as thread_title, 'timeline_comment' as reply_type FROM timeline_comments JOIN timeline_updates ON timeline_updates.id = timeline_comments.update_id WHERE timeline_comments.author_user_id = ? AND timeline_comments.is_deleted = 0 ORDER BY timeline_comments.created_at DESC LIMIT 10").bind(userId).all();
    const recentEventComments = await db.prepare("SELECT event_comments.id, event_comments.created_at, events.id as thread_id, events.title as thread_title, 'event_comment' as reply_type FROM event_comments JOIN events ON events.id = event_comments.event_id WHERE event_comments.author_user_id = ? AND event_comments.is_deleted = 0 ORDER BY event_comments.created_at DESC LIMIT 10").bind(userId).all();

    let recentPostComments = { results: [] };
    try {
      recentPostComments = await db.prepare("SELECT post_comments.id, post_comments.created_at, posts.id as thread_id, posts.title as thread_title, posts.type as post_type, 'post_comment' as reply_type FROM post_comments JOIN posts ON posts.id = post_comments.post_id WHERE post_comments.author_user_id = ? AND post_comments.is_deleted = 0 ORDER BY post_comments.created_at DESC LIMIT 10").bind(userId).all();
    } catch (_) {}

    const allPosts = [
      ...(recentForumThreads?.results || []).map((p) => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentDevLogs?.results || []).map((p) => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentMusicPosts?.results || []).map((p) => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentProjects?.results || []).map((p) => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentTimelineUpdates?.results || []).map((p) => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentEvents?.results || []).map((p) => ({ ...p, type: 'thread', postType: p.post_type })),
      ...(recentPostsFromShared?.results || []).map((p) => ({ ...p, type: 'thread', postType: p.post_type })),
    ];
    const allReplies = [
      ...(recentForumReplies?.results || []).map((r) => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentDevLogComments?.results || []).map((r) => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentMusicComments?.results || []).map((r) => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentProjectReplies?.results || []).map((r) => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentTimelineComments?.results || []).map((r) => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentEventComments?.results || []).map((r) => ({ ...r, type: 'reply', replyType: r.reply_type })),
      ...(recentPostComments?.results || []).map((r) => ({ ...r, type: 'reply', replyType: r.reply_type, post_type: r.post_type })),
    ];
    const allActivity = [...allPosts, ...allReplies].sort((a, b) => b.created_at - a.created_at).slice(0, 10);

    // Base user row (no profile-extras columns) so stats never fail if migration 0054 not applied
    let userInfo = null;
    try {
      userInfo = await db.prepare('SELECT created_at, profile_links, profile_views, time_spent_minutes, avatar_edit_minutes FROM users WHERE id = ?').bind(userId).first();
    } catch (e) {
      try {
        userInfo = await db.prepare('SELECT created_at, profile_links, profile_views FROM users WHERE id = ?').bind(userId).first();
      } catch (_) {}
    }
    // Profile extras (mood, song, headline, default tab) from migration 0054 – separate query so one DB can have columns, other code paths can be older
    let extras = null;
    try {
      extras = await db
        .prepare(
          `SELECT profile_mood_text, profile_mood_emoji, profile_mood_updated_at,
           profile_song_url, profile_song_provider, profile_song_autoplay_enabled,
           profile_headline, default_profile_tab FROM users WHERE id = ?`
        )
        .bind(userId)
        .first();
    } catch (_) {}
    if (userInfo && extras) {
      userInfo = { ...userInfo, ...extras };
    } else if (extras) {
      userInfo = extras;
    }

    let profileLinks = [];
    if (userInfo?.profile_links) {
      try {
        const parsed = JSON.parse(userInfo.profile_links);
        if (Array.isArray(parsed)) profileLinks = parsed;
      } catch (e) {
        profileLinks = userInfo.profile_links.split(',').map((link) => link.trim()).filter(Boolean);
      }
    }

    const profileViews =
      options.profileViewsDisplay !== undefined
        ? options.profileViewsDisplay
        : Number(userInfo?.profile_views) || 0;

    return {
      threadCount: Number(threadCount) || 0,
      replyCount: Number(replyCount) || 0,
      joinDate: userInfo?.created_at ?? null,
      recentThreads: allPosts.slice(0, 10),
      recentReplies: allReplies.slice(0, 10),
      recentActivity: allActivity,
      profileLinks,
      profileViews,
      timeSpentMinutes: Number(userInfo?.time_spent_minutes) || 0,
      avatarEditMinutes: Number(userInfo?.avatar_edit_minutes) || 0,
      profileMoodText: userInfo?.profile_mood_text ?? '',
      profileMoodEmoji: userInfo?.profile_mood_emoji ?? '',
      profileSongUrl: userInfo?.profile_song_url ?? '',
      profileSongProvider: userInfo?.profile_song_provider ?? '',
      profileSongAutoplayEnabled: Boolean(userInfo?.profile_song_autoplay_enabled),
      profileHeadline: userInfo?.profile_headline ?? '',
      defaultProfileTab: userInfo?.default_profile_tab ?? null,
    };
  } catch (e) {
    return empty;
  }
}
