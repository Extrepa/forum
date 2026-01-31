import ClaimUsernameForm from '../../components/ClaimUsernameForm';
import Breadcrumbs from '../../components/Breadcrumbs';
import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import AccountTabsClient from './AccountTabsClient';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }) {
  const params = await searchParams;
  const user = await getSessionUser();
  const db = await getDb();

  let stats = null;
  let userInfo = null;
  if (user) {
    try {
      // Get post count from all post types
      const forumThreads = await db
        .prepare('SELECT COUNT(*) as count FROM forum_threads WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)')
        .bind(user.id)
        .first();
      
      const devLogs = await db
        .prepare('SELECT COUNT(*) as count FROM dev_logs WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)')
        .bind(user.id)
        .first();
      
      const musicPosts = await db
        .prepare('SELECT COUNT(*) as count FROM music_posts WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)')
        .bind(user.id)
        .first();
      
      const projects = await db
        .prepare('SELECT COUNT(*) as count FROM projects WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)')
        .bind(user.id)
        .first();
      
      const timelineUpdates = await db
        .prepare('SELECT COUNT(*) as count FROM timeline_updates WHERE author_user_id = ?')
        .bind(user.id)
        .first();
      
      const events = await db
        .prepare('SELECT COUNT(*) as count FROM events WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)')
        .bind(user.id)
        .first();
      
      const threadCount = (forumThreads?.count || 0) + 
                          (devLogs?.count || 0) + 
                          (musicPosts?.count || 0) + 
                          (projects?.count || 0) + 
                          (timelineUpdates?.count || 0) + 
                          (events?.count || 0);
      
      // Get reply count from all comment types
      const forumReplies = await db
        .prepare('SELECT COUNT(*) as count FROM forum_replies WHERE author_user_id = ? AND is_deleted = 0')
        .bind(user.id)
        .first();
      
      const devLogComments = await db
        .prepare('SELECT COUNT(*) as count FROM dev_log_comments WHERE author_user_id = ? AND is_deleted = 0')
        .bind(user.id)
        .first();
      
      const musicComments = await db
        .prepare('SELECT COUNT(*) as count FROM music_comments WHERE author_user_id = ? AND is_deleted = 0')
        .bind(user.id)
        .first();
      
      const projectReplies = await db
        .prepare('SELECT COUNT(*) as count FROM project_replies WHERE author_user_id = ? AND is_deleted = 0')
        .bind(user.id)
        .first();
      
      const timelineComments = await db
        .prepare('SELECT COUNT(*) as count FROM timeline_comments WHERE author_user_id = ? AND is_deleted = 0')
        .bind(user.id)
        .first();
      
      const eventComments = await db
        .prepare('SELECT COUNT(*) as count FROM event_comments WHERE author_user_id = ? AND is_deleted = 0')
        .bind(user.id)
        .first();
      
      const replyCount = (forumReplies?.count || 0) + 
                         (devLogComments?.count || 0) + 
                         (musicComments?.count || 0) + 
                         (projectReplies?.count || 0) + 
                         (timelineComments?.count || 0) + 
                         (eventComments?.count || 0);

      // Get recent activity from all post types (last 10 items total)
      const recentForumThreads = await db
        .prepare(
          `SELECT id, title, created_at, 'forum_thread' as post_type FROM forum_threads 
           WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
           ORDER BY created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      const recentDevLogs = await db
        .prepare(
          `SELECT id, title, created_at, 'dev_log' as post_type FROM dev_logs 
           WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
           ORDER BY created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      const recentMusicPosts = await db
        .prepare(
          `SELECT id, title, created_at, 'music_post' as post_type FROM music_posts 
           WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
           ORDER BY created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      const recentProjects = await db
        .prepare(
          `SELECT id, title, created_at, 'project' as post_type FROM projects 
           WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
           ORDER BY created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      const recentTimelineUpdates = await db
        .prepare(
          `SELECT id, title, created_at, 'timeline_update' as post_type FROM timeline_updates 
           WHERE author_user_id = ?
           ORDER BY created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      const recentEvents = await db
        .prepare(
          `SELECT id, title, created_at, 'event' as post_type FROM events 
           WHERE author_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
           ORDER BY created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      // Get recent replies/comments from all types
      const recentForumReplies = await db
        .prepare(
          `SELECT forum_replies.id, forum_replies.created_at, forum_threads.id as thread_id, forum_threads.title as thread_title, 'forum_reply' as reply_type
           FROM forum_replies
           JOIN forum_threads ON forum_threads.id = forum_replies.thread_id
           WHERE forum_replies.author_user_id = ? AND forum_replies.is_deleted = 0
           ORDER BY forum_replies.created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      const recentDevLogComments = await db
        .prepare(
          `SELECT dev_log_comments.id, dev_log_comments.created_at, dev_logs.id as thread_id, dev_logs.title as thread_title, 'dev_log_comment' as reply_type
           FROM dev_log_comments
           JOIN dev_logs ON dev_logs.id = dev_log_comments.log_id
           WHERE dev_log_comments.author_user_id = ? AND dev_log_comments.is_deleted = 0
           ORDER BY dev_log_comments.created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      const recentMusicComments = await db
        .prepare(
          `SELECT music_comments.id, music_comments.created_at, music_posts.id as thread_id, music_posts.title as thread_title, 'music_comment' as reply_type
           FROM music_comments
           JOIN music_posts ON music_posts.id = music_comments.post_id
           WHERE music_comments.author_user_id = ? AND music_comments.is_deleted = 0
           ORDER BY music_comments.created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      const recentProjectReplies = await db
        .prepare(
          `SELECT project_replies.id, project_replies.created_at, projects.id as thread_id, projects.title as thread_title, 'project_reply' as reply_type
           FROM project_replies
           JOIN projects ON projects.id = project_replies.project_id
           WHERE project_replies.author_user_id = ? AND project_replies.is_deleted = 0
           ORDER BY project_replies.created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      const recentTimelineComments = await db
        .prepare(
          `SELECT timeline_comments.id, timeline_comments.created_at, timeline_updates.id as thread_id, timeline_updates.title as thread_title, 'timeline_comment' as reply_type
           FROM timeline_comments
           JOIN timeline_updates ON timeline_updates.id = timeline_comments.update_id
           WHERE timeline_comments.author_user_id = ? AND timeline_comments.is_deleted = 0
           ORDER BY timeline_comments.created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      const recentEventComments = await db
        .prepare(
          `SELECT event_comments.id, event_comments.created_at, events.id as thread_id, events.title as thread_title, 'event_comment' as reply_type
           FROM event_comments
           JOIN events ON events.id = event_comments.event_id
           WHERE event_comments.author_user_id = ? AND event_comments.is_deleted = 0
           ORDER BY event_comments.created_at DESC LIMIT 10`
        )
        .bind(user.id)
        .all();

      // Get user info including profile links and profile extras (graceful fallback if new columns aren't present)
      try {
        userInfo = await db
          .prepare(
            `SELECT created_at, profile_links, profile_views, time_spent_minutes, avatar_edit_minutes,
             profile_mood_text, profile_mood_emoji, profile_mood_updated_at,
             profile_song_url, profile_song_provider, profile_song_autoplay_enabled,
             profile_headline
             FROM users WHERE id = ?`
          )
          .bind(user.id)
          .first();
      } catch (e) {
        try {
          userInfo = await db
            .prepare('SELECT created_at, profile_links, profile_views, time_spent_minutes, avatar_edit_minutes FROM users WHERE id = ?')
            .bind(user.id)
            .first();
        } catch (e2) {
          userInfo = await db
            .prepare('SELECT created_at, profile_links, profile_views FROM users WHERE id = ?')
            .bind(user.id)
            .first();
        }
      }

      // Merge and sort recent activity
      const allPosts = [
        ...(recentForumThreads?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
        ...(recentDevLogs?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
        ...(recentMusicPosts?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
        ...(recentProjects?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
        ...(recentTimelineUpdates?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type })),
        ...(recentEvents?.results || []).map(p => ({ ...p, type: 'thread', postType: p.post_type }))
      ];

      const allReplies = [
        ...(recentForumReplies?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
        ...(recentDevLogComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
        ...(recentMusicComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
        ...(recentProjectReplies?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
        ...(recentTimelineComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type })),
        ...(recentEventComments?.results || []).map(r => ({ ...r, type: 'reply', replyType: r.reply_type }))
      ];

      const allActivity = [...allPosts, ...allReplies]
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 10);

      // Parse profile links if they exist
      let profileLinks = [];
      if (userInfo?.profile_links) {
        try {
          const parsed = JSON.parse(userInfo.profile_links);
          if (Array.isArray(parsed)) {
            profileLinks = parsed;
          }
        } catch (e) {
          // If not JSON, try comma-separated
          profileLinks = userInfo.profile_links.split(',').map(link => link.trim()).filter(Boolean);
        }
      }

      stats = {
        threadCount,
        replyCount,
        joinDate: userInfo?.created_at || user.created_at,
        recentThreads: allPosts.slice(0, 10),
        recentReplies: allReplies.slice(0, 10),
        recentActivity: allActivity,
        profileLinks,
        profileViews: userInfo?.profile_views || 0,
        timeSpentMinutes: userInfo?.time_spent_minutes || 0,
        avatarEditMinutes: userInfo?.avatar_edit_minutes || 0,
        profileMoodText: userInfo?.profile_mood_text ?? '',
        profileMoodEmoji: userInfo?.profile_mood_emoji ?? '',
        profileSongUrl: userInfo?.profile_song_url ?? '',
        profileSongProvider: userInfo?.profile_song_provider ?? '',
        profileSongAutoplayEnabled: Boolean(userInfo?.profile_song_autoplay_enabled),
        profileHeadline: userInfo?.profile_headline ?? '',
      };
    } catch (e) {
      // Fallback if queries fail
      stats = {
        threadCount: 0,
        replyCount: 0,
        joinDate: user.created_at,
        recentThreads: [],
        recentReplies: [],
        recentActivity: [],
        profileLinks: [],
        profileViews: userInfo?.profile_views || 0,
        timeSpentMinutes: userInfo?.time_spent_minutes || 0,
        avatarEditMinutes: userInfo?.avatar_edit_minutes || 0,
        profileMoodText: userInfo?.profile_mood_text ?? '',
        profileMoodEmoji: userInfo?.profile_mood_emoji ?? '',
        profileSongUrl: userInfo?.profile_song_url ?? '',
        profileSongProvider: userInfo?.profile_song_provider ?? '',
        profileSongAutoplayEnabled: Boolean(userInfo?.profile_song_autoplay_enabled),
        profileHeadline: userInfo?.profile_headline ?? '',
      };
    }
  }

  const activeTab = params?.tab || 'profile';

  return (
    <div className="stack">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/account', label: 'Account' }]} />
      <AccountTabsClient 
        activeTab={activeTab}
        user={user}
        stats={stats}
      />
    </div>
  );
}
