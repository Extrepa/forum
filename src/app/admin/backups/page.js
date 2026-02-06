import Breadcrumbs from '../../../components/Breadcrumbs';
import { getSessionUser } from '../../../lib/auth';
import { isAdminUser } from '../../../lib/admin';

export const dynamic = 'force-dynamic';

export default async function BackupsPage() {
  const user = await getSessionUser();
  const isAdmin = !!user && isAdminUser(user);

  if (!isAdmin) {
    return (
      <section className="card">
        <h2 className="section-title">Unauthorized</h2>
        <p className="muted">Admins only.</p>
      </section>
    );
  }

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/admin', label: 'Admin' },
          { href: '/admin/backups', label: 'Backups' }
        ]}
      />

      <section className="card">
        <h2 className="section-title">Backups</h2>
        <p className="muted">
          Backups are currently handled manually through Cloudflare. This page will track automated
          backup status once it is wired up.
        </p>
        <div className="stack" style={{ gap: '12px', marginTop: '12px' }}>
          <div className="admin-panel">
            <h3 className="section-title">Status</h3>
            <p className="muted">Manual exports only (no scheduled backups configured yet).</p>
          </div>
          <div className="admin-panel">
            <h3 className="section-title">Next steps</h3>
            <ul className="admin-action-list">
              <li>Export the D1 database from Cloudflare when needed.</li>
              <li>Store export files in a secure backup location.</li>
              <li>Schedule automation once the backup pipeline is defined.</li>
            </ul>
          </div>
          <a className="action-button" href="/admin">Back to Admin Console</a>
        </div>
      </section>
    </div>
  );
}
