import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    // Simple query to check database connectivity
    await db.prepare('SELECT 1').first();
    
    return NextResponse.json({
      online: true,
      timestamp: Date.now()
    });
  } catch (error) {
    return NextResponse.json({
      online: false,
      timestamp: Date.now()
    }, { status: 503 });
  }
}
