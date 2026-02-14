import TimelineClient from '../timeline/TimelineClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import { getSessionUser } from '../../lib/auth';
import { isAdminUser } from '../../lib/admin';
import NewPostModalButton from '../../components/NewPostModalButton';
import ShowHiddenToggleButton from '../../components/ShowHiddenToggleButton';
import PostForm from '../../components/PostForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const isAdmin = isAdminUser(user);
  const showHidden = isAdmin && searchParams?.showHidden === '1';
  const db = await getDb();
  let results = [];
  const hiddenFilter = showHidden ? '' : 'AND (timeline_updates.is_hidden = 0 OR timeline_updates.is_hidden IS NULL)';
  try {
    const out = await db
      .prepare(
        `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body,
                timeline_updates.created_at, timeline_updates.image_key,
                COALESCE(timeline_updates.views, 0) AS views,
                COALESCE(timeline_updates.is_pinned, 0) AS is_pinned,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM timeline_comments WHERE timeline_comments.update_id = timeline_updates.id AND timeline_comments.is_deleted = 0) AS comment_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'timeline_update' AND post_id = timeline_updates.id) AS like_count,
                COALESCE((SELECT MAX(created_at) FROM timeline_comments WHERE update_id = timeline_updates.id AND is_deleted = 0), timeline_updates.created_at) AS last_activity_at
         FROM timeline_updates
         JOIN users ON users.id = timeline_updates.author_user_id
         WHERE timeline_updates.moved_to_id IS NULL
           ${hiddenFilter}
           AND (timeline_updates.is_deleted = 0 OR timeline_updates.is_deleted IS NULL)
         ORDER BY is_pinned DESC, timeline_updates.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body,
                timeline_updates.created_at, timeline_updates.image_key,
                COALESCE(timeline_updates.views, 0) AS views,
                COALESCE(timeline_updates.is_pinned, 0) AS is_pinned,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM timeline_comments WHERE timeline_comments.update_id = timeline_updates.id AND timeline_comments.is_deleted = 0) AS comment_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'timeline_update' AND post_id = timeline_updates.id) AS like_count,
                COALESCE((SELECT MAX(created_at) FROM timeline_comments WHERE update_id = timeline_updates.id AND is_deleted = 0), timeline_updates.created_at) AS last_activity_at
         FROM timeline_updates
         JOIN users ON users.id = timeline_updates.author_user_id
         ORDER BY is_pinned DESC, timeline_updates.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  }

  // Add unread status for logged-in users
  if (user && results.length > 0) {
    try {
      const updateIds = results.map(u => u.id);
      if (updateIds.length > 0) {
        const placeholders = updateIds.map(() => '?').join(',');
        const readStates = await db
          .prepare(
            `SELECT content_id FROM content_reads 
             WHERE user_id = ? AND content_type = 'timeline_update' AND content_id IN (${placeholders})`
          )
          .bind(user.id, ...updateIds)
          .all();

        const readSet = new Set();
        (readStates?.results || []).forEach(r => {
          readSet.add(r.content_id);
        });

        results.forEach(update => {
          update.is_unread = !readSet.has(update.id);
        });
      } else {
        results.forEach(update => {
          update.is_unread = false;
        });
      }
    } catch (e) {
      // content_reads table might not exist yet, mark all as read
      results.forEach(update => {
        update.is_unread = false;
      });
    }
  } else {
    results.forEach(update => {
      update.is_unread = false;
    });
  }

  const updates = results.map((row) => ({
    ...row,
    bodyHtml: renderMarkdown(row.body)
  }));

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Sign in before posting announcements.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'admin_required'
      ? 'Only admins can post announcements.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title and body are required.'
      : null;

  const canCreate = !!user && !!user.password_hash && isAdmin;

  return (
    <>
      <TimelineClient headerActions={
          <>
            {isAdmin ? <ShowHiddenToggleButton showHidden={showHidden} searchParams={searchParams} /> : null}
            <NewPostModalButton label="New Announcement" title="Post Announcement" disabled={!canCreate}>
              <PostForm
                action="/api/timeline"
                titleLabel="Title"
                bodyLabel="Update"
                buttonLabel="Post Announcement"
                titleRequired={false}
                showImage={true}
              />
            </NewPostModalButton>
          </>
        } updates={updates} notice={notice} basePath="/announcements" />
    </>
  );
}
