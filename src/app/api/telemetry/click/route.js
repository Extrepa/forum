import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

function cleanText(value, max = 240) {
  const v = String(value || '').replace(/\s+/g, ' ').trim();
  return v ? v.slice(0, max) : null;
}

export async function POST(request) {
  let payload = null;
  try {
    payload = await request.json();
  } catch (e) {
    return NextResponse.json({ ok: true });
  }

  const path = cleanText(payload?.path, 300);
  if (!path) {
    return NextResponse.json({ ok: true });
  }

  const user = await getSessionUser();
  const db = await getDb();

  try {
    await db
      .prepare(
        `INSERT INTO click_events
         (id, user_id, username, path, href, tag_name, target_label, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        globalThis.crypto.randomUUID(),
        user?.id ?? null,
        user?.username ?? null,
        path,
        cleanText(payload?.href, 500),
        cleanText(payload?.tagName, 40),
        cleanText(payload?.label, 240),
        cleanText(request.headers.get('user-agent'), 500),
        Number(payload?.createdAt) || Date.now()
      )
      .run();
  } catch (e) {
    // Never block user flow due to telemetry failures.
  }

  return NextResponse.json({ ok: true });
}
