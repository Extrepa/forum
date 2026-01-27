import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const loreEnabled = payload.loreEnabled ? 1 : 0;
  const colorMode = payload.colorMode !== undefined ? parseInt(payload.colorMode) : 0;
  const borderColor = payload.borderColor || null;
  const invertColors = payload.invertColors ? 1 : 0;

  const db = await getDb();
  try {
    await db
      .prepare('UPDATE users SET ui_lore_enabled = ?, ui_color_mode = ?, ui_border_color = ?, ui_invert_colors = ? WHERE id = ?')
      .bind(loreEnabled, colorMode, borderColor, invertColors, user.id)
      .run();
  } catch (error) {
    return NextResponse.json(
      { error: 'UI preferences are not available yet (missing migration).' },
      { status: 409 }
    );
  }

  return NextResponse.json({ 
    ok: true, 
    uiLoreEnabled: !!loreEnabled,
    uiColorMode: colorMode,
    uiBorderColor: borderColor,
    uiInvertColors: !!invertColors
  });
}

