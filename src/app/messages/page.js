import Breadcrumbs from '../../components/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default function MessagesPage() {
  return (
    <div className="stack">
      <div className="page-top-row">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/messages', label: 'Messages' }]} />
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ marginTop: 0 }}>Messages</h2>
        <p className="muted">Messages are being wired up next. This space will host your inbox and conversation threads.</p>
      </div>
    </div>
  );
}
