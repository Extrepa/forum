-- 0052_add_admin_audit_fields.sql
--
-- Add edited_at and updated_by_user_id for admin audit trail.

ALTER TABLE forum_threads ADD COLUMN edited_at INTEGER;
ALTER TABLE forum_threads ADD COLUMN updated_by_user_id TEXT;
ALTER TABLE timeline_updates ADD COLUMN edited_at INTEGER;
ALTER TABLE timeline_updates ADD COLUMN updated_by_user_id TEXT;
ALTER TABLE posts ADD COLUMN edited_at INTEGER;
ALTER TABLE posts ADD COLUMN updated_by_user_id TEXT;
ALTER TABLE events ADD COLUMN edited_at INTEGER;
ALTER TABLE events ADD COLUMN updated_by_user_id TEXT;
ALTER TABLE music_posts ADD COLUMN edited_at INTEGER;
ALTER TABLE music_posts ADD COLUMN updated_by_user_id TEXT;
ALTER TABLE projects ADD COLUMN edited_at INTEGER;
ALTER TABLE projects ADD COLUMN updated_by_user_id TEXT;
ALTER TABLE dev_logs ADD COLUMN edited_at INTEGER;
ALTER TABLE dev_logs ADD COLUMN updated_by_user_id TEXT;
