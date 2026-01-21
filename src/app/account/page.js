import ClaimUsernameForm from '../../components/ClaimUsernameForm';
import Breadcrumbs from '../../components/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default function AccountPage() {
  return (
    <div className="stack">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/account', label: 'Account' }]} />
      <section className="card">
        <h2 className="section-title">Account</h2>
        <p className="muted">Simple settings, quick updates.</p>
      </section>
      <ClaimUsernameForm />
    </div>
  );
}

