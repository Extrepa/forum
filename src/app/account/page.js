import Breadcrumbs from '../../components/Breadcrumbs';
import Link from 'next/link';
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
  const profileSubTab = params?.subtab || null;

  return (
    <div className="stack">
      <div className="page-top-row">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/account', label: 'Account' }]} />
        <div className="page-top-row-right">
          {user?.username && (
            <Link href={`/profile/${encodeURIComponent(user.username)}`} className="action-button">
              View Public Profile
            </Link>
          )}
        </div>
      </div>
      <AccountTabsClient 
        activeTab={activeTab}
        user={user}
        stats={stats}
        profileSubTab={profileSubTab}
      />
    </div>
  );
}
