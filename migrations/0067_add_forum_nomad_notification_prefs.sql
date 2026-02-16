-- 0067_add_forum_nomad_notification_prefs.sql
-- Optional notifications: new forum threads (all users), nomad section activity.

ALTER TABLE users ADD COLUMN notify_new_forum_threads_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN notify_nomad_activity_enabled INTEGER NOT NULL DEFAULT 0;
