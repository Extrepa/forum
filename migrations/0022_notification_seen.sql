-- 0022_notification_seen.sql
--
-- Add seen tracking for notifications

ALTER TABLE notifications ADD COLUMN seen_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_notifications_user_seen
  ON notifications(user_id, seen_at);
