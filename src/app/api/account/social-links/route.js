import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export async function POST(request) {
  const user = await getSessionUser();
  
  if (!user || !user.password_hash) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const linksJson = String(formData.get('links') || '[]').trim();

  let links;
  try {
    links = JSON.parse(linksJson);
    if (!Array.isArray(links)) {
      return NextResponse.json({ error: 'Invalid links format. Must be an array.' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON format for links' }, { status: 400 });
  }

  // Validate links structure
  for (const link of links) {
    if (!link.platform || !link.url) {
      return NextResponse.json({ error: 'Each link must have platform and url' }, { status: 400 });
    }
    if (typeof link.platform !== 'string' || typeof link.url !== 'string') {
      return NextResponse.json({ error: 'Platform and url must be strings' }, { status: 400 });
    }
    // Basic URL validation
    try {
      new URL(link.url);
    } catch (e) {
      return NextResponse.json({ error: `Invalid URL: ${link.url}` }, { status: 400 });
    }
  }

  const db = await getDb();

  try {
    const linksJsonString = JSON.stringify(links);
    await db
      .prepare('UPDATE users SET profile_links = ? WHERE id = ?')
      .bind(linksJsonString, user.id)
      .run();

    return NextResponse.json({ success: true, links });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update social links' }, { status: 500 });
  }
}
