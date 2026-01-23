-- 0031_add_view_counts.sql
--
-- Add views tracking to all content types

ALTER TABLE dev_logs ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE music_posts ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE timeline_updates ADD COLUMN views INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_dev_logs_views ON dev_logs(views);
CREATE INDEX IF NOT EXISTS idx_music_posts_views ON music_posts(views);
CREATE INDEX IF NOT EXISTS idx_events_views ON events(views);
CREATE INDEX IF NOT EXISTS idx_projects_views ON projects(views);
CREATE INDEX IF NOT EXISTS idx_posts_views ON posts(views);
CREATE INDEX IF NOT EXISTS idx_timeline_updates_views ON timeline_updates(views);
