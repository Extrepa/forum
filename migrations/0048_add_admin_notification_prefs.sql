-- 0048_add_admin_notification_prefs.sql
--
-- Admin-only notification preferences.
-- Defaults to 0 (disabled) so admins opt in explicitly.

ALTER TABLE users ADD COLUMN notify_admin_new_user_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN notify_admin_new_post_enabled INTEGER NOT NULL DEFAULT 0;
