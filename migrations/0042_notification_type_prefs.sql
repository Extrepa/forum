-- 0042_notification_type_prefs.sql
--
-- Add columns for specific notification type preferences.
-- Defaults to 1 (enabled) so existing users keep getting them.

ALTER TABLE users ADD COLUMN notify_rsvp_enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notify_like_enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notify_update_enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notify_mention_enabled INTEGER NOT NULL DEFAULT 1;
