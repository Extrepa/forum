-- 0053_add_admin_reply_prefs.sql
--
-- Admin notification preference for new forum replies.

ALTER TABLE users ADD COLUMN notify_admin_new_reply_enabled INTEGER NOT NULL DEFAULT 0;
