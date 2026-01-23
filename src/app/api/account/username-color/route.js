import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

const PALETTE_SIZE = 8;

export async function POST(request) {
  const user = await getSessionUser();
  
  if (!user || !user.password_hash) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const colorIndexStr = String(formData.get('color_index') || '').trim();

  // Allow empty string to set to NULL (auto/default)
  let colorIndex = null;
  if (colorIndexStr !== '') {
    colorIndex = Number(colorIndexStr);
    if (Number.isNaN(colorIndex) || colorIndex < 0 || colorIndex >= PALETTE_SIZE) {
      return NextResponse.json({ error: 'Invalid color index. Must be 0-7 or empty for auto.' }, { status: 400 });
    }
  }

  const db = await getDb();

  try {
    await db
      .prepare('UPDATE users SET preferred_username_color_index = ? WHERE id = ?')
      .bind(colorIndex, user.id)
      .run();

    return NextResponse.json({ success: true, colorIndex });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update color preference' }, { status: 500 });
  }
}
