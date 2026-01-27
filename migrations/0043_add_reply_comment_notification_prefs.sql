-- 0043_add_reply_comment_notification_prefs.sql
--
-- Add columns for reply and comment notification preferences.
-- Defaults to 1 (enabled).

ALTER TABLE users ADD COLUMN notify_reply_enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notify_comment_enabled INTEGER NOT NULL DEFAULT 1;
