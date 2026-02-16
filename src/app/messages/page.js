import { Suspense } from 'react';
import { getSessionUser } from '../../lib/auth';
import { isAdminUser } from '../../lib/admin';
import MessagesClient from '../../components/MessagesClient';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const user = await getSessionUser();
  const isAdmin = isAdminUser(user);

  return (
    <div className="stack">
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ marginTop: 0 }}>Messages</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Private conversations with other forum members. Compose to individuals or groups.
        </p>
        <Suspense fallback={<p className="muted">Loading messages...</p>}>
          <MessagesClient user={user} isAdmin={isAdmin} />
        </Suspense>
      </div>
    </div>
  );
}
