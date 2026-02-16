-- Optional sub-target for notifications (e.g. comment/reply id).
-- When a comment or reply is deleted, we can remove only that notification.

ALTER TABLE notifications ADD COLUMN target_sub_id TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_target_sub_id
  ON notifications(target_sub_id) WHERE target_sub_id IS NOT NULL;
