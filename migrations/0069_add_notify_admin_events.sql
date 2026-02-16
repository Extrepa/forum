-- 0069_add_notify_admin_events.sql
-- Admin notification event toggles: post manipulation, user changes, etc.
-- JSON object: { "post_deleted": true, "content_edited": true, ... }

ALTER TABLE users ADD COLUMN notify_admin_events TEXT NOT NULL DEFAULT '{}';
