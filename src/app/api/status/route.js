import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getEdgeContext } from '../../../lib/edgeContext';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const debug = url.searchParams.get('debug') === '1';
  const { requestId } = debug ? await getEdgeContext() : { requestId: null };

  try {
    const db = await getDb();
    // Simple query to check database connectivity
    await db.prepare('SELECT 1').first();
    
    return NextResponse.json({
      online: true,
      timestamp: Date.now(),
      ...(debug ? { requestId } : {})
    });
  } catch (error) {
    return NextResponse.json({
      online: false,
      timestamp: Date.now(),
      ...(debug ? { requestId } : {})
    }, { status: 503 });
  }
}
