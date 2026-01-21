-- 0007_notifications.sql
--
-- In-app notifications for replies (no external delivery yet).

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  read_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created_at
  ON notifications(user_id, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
  ON notifications(user_id, created_at DESC);

-- Preferences stored for future email/SMS delivery (defaults off)
ALTER TABLE users ADD COLUMN notify_email_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN notify_sms_enabled INTEGER NOT NULL DEFAULT 0;

