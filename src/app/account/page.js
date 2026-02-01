import Breadcrumbs from '../../components/Breadcrumbs';
import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { getStatsForUser } from '../../lib/stats';
import AccountTabsClient from './AccountTabsClient';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }) {
  const params = await searchParams;
  const user = await getSessionUser();
  const db = await getDb();

  let stats = null;
  if (user) {
    stats = await getStatsForUser(db, user.id);
    stats.joinDate = stats.joinDate ?? user.created_at;
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
