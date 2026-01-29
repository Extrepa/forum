import DevLogClient from './DevLogClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import { isAdminUser } from '../../lib/admin';
import { getSessionUser } from '../../lib/auth';
import Breadcrumbs from '../../components/Breadcrumbs';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import DevLogForm from '../../components/DevLogForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DevLogPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const isAdmin = isAdminUser(user);

  const db = await getDb();
  let results = [];
  let dbUnavailable = false;
  try {
    const out = await db
      .prepare(
        `SELECT dev_logs.id, dev_logs.title, dev_logs.body, dev_logs.image_key,
                dev_logs.is_locked,
                dev_logs.created_at, dev_logs.updated_at,
                COALESCE(dev_logs.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM dev_log_comments WHERE dev_log_comments.log_id = dev_logs.id AND dev_log_comments.is_deleted = 0) AS comment_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'dev_log' AND post_id = dev_logs.id) AS like_count,
                COALESCE((SELECT MAX(created_at) FROM dev_log_comments WHERE log_id = dev_logs.id AND is_deleted = 0), dev_logs.created_at) AS last_activity_at
         FROM dev_logs
         JOIN users ON users.id = dev_logs.author_user_id
         WHERE (dev_logs.is_hidden = 0 OR dev_logs.is_hidden IS NULL)
           AND (dev_logs.is_deleted = 0 OR dev_logs.is_deleted IS NULL)
         ORDER BY dev_logs.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  } catch (e) {
    // Backward/rollout compatibility:
    // - If the table/column isn't migrated yet, fall back to a query without is_locked.
    try {
      const out = await db
        .prepare(
          `SELECT dev_logs.id, dev_logs.title, dev_logs.body, dev_logs.image_key,
                  dev_logs.created_at, dev_logs.updated_at,
                  COALESCE(dev_logs.views, 0) AS views,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  (SELECT COUNT(*) FROM dev_log_comments WHERE dev_log_comments.log_id = dev_logs.id AND dev_log_comments.is_deleted = 0) AS comment_count,
                  (SELECT COUNT(*) FROM post_likes WHERE post_type = 'dev_log' AND post_id = dev_logs.id) AS like_count,
                  COALESCE((SELECT MAX(created_at) FROM dev_log_comments WHERE log_id = dev_logs.id AND is_deleted = 0), dev_logs.created_at) AS last_activity_at
           FROM dev_logs
           JOIN users ON users.id = dev_logs.author_user_id
           ORDER BY dev_logs.created_at DESC
           LIMIT 50`
        )
        .all();
      results = out?.results || [];
    } catch (e2) {
      dbUnavailable = true;
      results = [];
    }
  }

  // Add unread status for logged-in users
  if (user && results.length > 0) {
    try {
      const logIds = results.map(l => l.id);
      if (logIds.length > 0) {
        const placeholders = logIds.map(() => '?').join(',');
        const readStates = await db
          .prepare(
            `SELECT content_id FROM content_reads 
             WHERE user_id = ? AND content_type = 'dev_log' AND content_id IN (${placeholders})`
          )
          .bind(user.id, ...logIds)
          .all();

        const readSet = new Set();
        (readStates?.results || []).forEach(r => {
          readSet.add(r.content_id);
        });

        results.forEach(log => {
          log.is_unread = !readSet.has(log.id);
        });
      } else {
        results.forEach(log => {
          log.is_unread = false;
        });
      }
    } catch (e) {
      // content_reads table might not exist yet, mark all as read
      results.forEach(log => {
        log.is_unread = false;
      });
    }
  } else {
    results.forEach(log => {
      log.is_unread = false;
    });
  }

  const logs = results.map((row, index) => {
    const text = String(row.body || '').trim();
    // Show full content for the latest post (index 0), preview for others
    if (index === 0) {
      return { ...row, is_locked: row.is_locked || 0, bodyHtml: renderMarkdown(text) };
    }
    const lines = text.split('\n');
    const previewLines = lines.slice(0, 16).join('\n').trim();
    const preview =
      text.length > previewLines.length
        ? (previewLines + '\n\n…').trim()
        : text;
    return { ...row, is_locked: row.is_locked || 0, bodyHtml: renderMarkdown(preview) };
  });

  const error = searchParams?.error;
  const notice =
    dbUnavailable
      ? 'Development is not enabled yet on this environment. Apply migrations 0010_devlog.sql, 0011_devlog_lock.sql, and 0015_devlog_threaded_replies.sql.'
      : error === 'unauthorized'
      ? 'Only admins can post in Development.'
      : error === 'locked'
      ? 'Comments are locked on this post.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title and body are required.'
      : null;

  return (
    <>
      <PageTopRow
        items={[
          { href: '/', label: 'Home' },
          { href: '/devlog', label: 'Development' },
        ]}
        right={
          isAdmin ? (
            <NewPostModalButton label="New Development Post" title="New Development Post" variant="wide">
              <DevLogForm />
            </NewPostModalButton>
          ) : null
        }
      />
      <DevLogClient logs={logs} notice={notice} />
    </>
  );
}
