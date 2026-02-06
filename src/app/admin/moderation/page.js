import Breadcrumbs from '../../../components/Breadcrumbs';
import { getSessionUser } from '../../../lib/auth';
import { getDb } from '../../../lib/db';
import { isImageUploadsEnabled } from '../../../lib/settings';

export const dynamic = 'force-dynamic';

export default async function ModerationPage({ searchParams }) {
  const user = await getSessionUser();
  const isAdmin = !!user && user.role === 'admin';

  if (!isAdmin) {
    return (
      <section className="card">
        <h2 className="section-title">Unauthorized</h2>
        <p className="muted">Admins only.</p>
      </section>
    );
  }

  const db = await getDb();
  const imageUploadsEnabled = await isImageUploadsEnabled(db);

  const notice = searchParams?.notice ? String(searchParams.notice) : null;

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/admin', label: 'Admin' },
          { href: '/admin/moderation', label: 'Moderation' }
        ]}
      />

      <section className="card">
        <h2 className="section-title">Moderation</h2>
        <p className="muted">Move content between sections. Old URLs will redirect automatically after moves.</p>
        <p className="muted" style={{ marginTop: '6px' }}>
          Need the mod queue? Use the Admin Console Reports tab for open reports and triage.
        </p>
        <p className="muted" style={{ marginTop: '8px' }}>
          Note: Moving requires the D1 migration `migrations/0012_move_system.sql` to be applied.
        </p>
        {notice ? <div className="notice">{notice}</div> : null}
        <a className="action-button" href="/admin" style={{ marginTop: '12px', alignSelf: 'flex-start' }}>
          Back to Admin Console
        </a>
      </section>

      <section className="card">
        <h3 className="section-title">Image uploads</h3>
        <p className="muted">Toggle whether post forms across the forum can accept attached images.</p>
        <p className="muted" style={{ marginBottom: '12px' }}>
          Currently: {imageUploadsEnabled ? 'Enabled' : 'Disabled'}
        </p>
        <form action="/api/admin/settings/image-upload" method="post" className="stack" style={{ gap: '12px' }}>
          <input type="hidden" name="enabled" value={imageUploadsEnabled ? '0' : '1'} />
          <button type="submit" title="Toggle image uploads for all post forms">
            {imageUploadsEnabled ? 'Disable image uploads' : 'Enable image uploads'}
          </button>
        </form>
      </section>

      <section className="card">
        <h3 className="section-title">Move content</h3>
        <form action="/api/admin/move" method="post" className="stack" style={{ gap: '12px' }}>
          <label>
            <div className="muted">Source URL (recommended)</div>
            <input name="source_url" placeholder="https://forum.errl.wtf/forum/..." />
          </label>

          <div className="muted" style={{ marginTop: '4px' }}>Or specify directly:</div>
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
            <label>
              <div className="muted">Source type</div>
              <select name="source_type" defaultValue="forum_thread">
                <option value="forum_thread">Forum thread</option>
                <option value="project">Project</option>
                <option value="music_post">Music post</option>
                <option value="timeline_update">Announcement</option>
                <option value="event">Event</option>
                <option value="dev_log">Development</option>
              </select>
            </label>
            <label>
              <div className="muted">Source ID</div>
              <input name="source_id" placeholder="uuid" />
            </label>
          </div>

          <label>
            <div className="muted">Destination</div>
            <select name="dest_type" defaultValue="project">
              <option value="project">Projects</option>
              <option value="forum_thread">General</option>
              <option value="timeline_update">Announcements</option>
              <option value="event">Events</option>
              <option value="music_post">Music</option>
              <option value="dev_log">Development</option>
            </select>
          </label>

          <details className="muted" style={{ marginTop: '4px' }}>
            <summary>Destination-specific fields</summary>
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
              <label>
                <div className="muted">Events: starts_at (required if destination is Events)</div>
                <input name="starts_at" type="datetime-local" />
              </label>
              <label>
                <div className="muted">Projects: status</div>
                <select name="status" defaultValue="active">
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label>
                <div className="muted">Music: url (required if destination is Music)</div>
                <input name="url" type="url" placeholder="https://..." />
              </label>
              <label>
                <div className="muted">Music: type (required if destination is Music)</div>
                <input name="type" placeholder="youtube, soundcloud, bandcamp..." />
              </label>
              <label>
                <div className="muted">Music: tags (optional)</div>
                <input name="tags" placeholder="tag1,tag2" />
              </label>
            </div>
          </details>

          <button type="submit">Move</button>
        </form>
      </section>
    </div>
  );
}
