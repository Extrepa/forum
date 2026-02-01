import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';
import { getStatsForUser } from '../../../../lib/stats';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const stats = await getStatsForUser(db, user.id);
  return NextResponse.json({
    ...stats,
    joinDate: stats.joinDate ?? user.created_at,
  });
}
