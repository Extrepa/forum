import { getDb } from './db';

const IMAGE_UPLOAD_SETTING_KEY = 'image_uploads_enabled';

async function getAppSettingValue(key, dbInstance) {
  const db = dbInstance || (await getDb());
  try {
    const row = await db.prepare('SELECT value FROM app_settings WHERE key = ?').bind(key).first();
    return row?.value ?? null;
  } catch (error) {
    if (error?.message?.includes('no such table: app_settings')) {
      return null;
    }
    throw error;
  }
}

export async function isImageUploadsEnabled(dbInstance) {
  const value = await getAppSettingValue(IMAGE_UPLOAD_SETTING_KEY, dbInstance);
  if (value === null) {
    return true;
  }
  return value !== '0';
}

export async function setImageUploadsEnabled(enabled) {
  const db = await getDb();
  const normalizedValue = enabled ? '1' : '0';
  await db
    .prepare(
      'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
    )
    .bind(IMAGE_UPLOAD_SETTING_KEY, normalizedValue, normalizedValue)
    .run();
}
