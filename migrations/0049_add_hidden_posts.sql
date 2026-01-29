-- 0049_add_hidden_posts.sql

-- Add is_hidden to main content tables for temporary hiding.
ALTER TABLE forum_threads ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE timeline_updates ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE music_posts ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE dev_logs ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;

-- Add soft delete column for timeline updates (announcements), if missing.
ALTER TABLE timeline_updates ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_forum_threads_is_hidden ON forum_threads(is_hidden);
CREATE INDEX IF NOT EXISTS idx_timeline_updates_is_hidden ON timeline_updates(is_hidden);
CREATE INDEX IF NOT EXISTS idx_events_is_hidden ON events(is_hidden);
CREATE INDEX IF NOT EXISTS idx_music_posts_is_hidden ON music_posts(is_hidden);
CREATE INDEX IF NOT EXISTS idx_projects_is_hidden ON projects(is_hidden);
CREATE INDEX IF NOT EXISTS idx_dev_logs_is_hidden ON dev_logs(is_hidden);
CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON posts(is_hidden);
CREATE INDEX IF NOT EXISTS idx_timeline_updates_is_deleted ON timeline_updates(is_deleted);
