import DevLogClient from './DevLogClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import { isAdminUser } from '../../lib/admin';
import { getSessionUser } from '../../lib/auth';
import Breadcrumbs from '../../components/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default async function DevLogPage({ searchParams }) {
  const user = await getSessionUser();
  const isAdmin = isAdminUser(user);

  if (!user) {
    return (
      <>
        <Breadcrumbs
          items={[
            { href: '/', label: 'Home' },
            { href: '/devlog', label: 'Development' },
          ]}
        />
        <section className="card">
          <h2 className="section-title">Development</h2>
          <p className="muted">Sign in to view Development.</p>
        </section>
      </>
    );
  }

  const db = await getDb();
  let results = [];
  let dbUnavailable = false;
  try {
    const out = await db
      .prepare(
        `SELECT dev_logs.id, dev_logs.title, dev_logs.body, dev_logs.image_key,
                dev_logs.is_locked,
                dev_logs.created_at, dev_logs.updated_at,
                users.username AS author_name,
                (SELECT COUNT(*) FROM dev_log_comments WHERE dev_log_comments.log_id = dev_logs.id AND dev_log_comments.is_deleted = 0) AS comment_count
         FROM dev_logs
         JOIN users ON users.id = dev_logs.author_user_id
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
                  users.username AS author_name,
                  (SELECT COUNT(*) FROM dev_log_comments WHERE dev_log_comments.log_id = dev_logs.id AND dev_log_comments.is_deleted = 0) AS comment_count
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

  const logs = results.map((row) => {
    const text = String(row.body || '').trim();
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
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/devlog', label: 'Development' },
        ]}
      />
      <DevLogClient logs={logs} notice={notice} isAdmin={isAdmin} />
    </>
  );
}

