-- 0060_image_upload_settings.sql
-- Tracking flags such as whether image uploads are enabled for posts.
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO app_settings (key, value) VALUES ('image_uploads_enabled', '1');
