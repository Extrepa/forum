-- 0028_soft_delete_all_tables.sql
--
-- Add is_deleted column to all main content tables for soft deletion
-- Note: If columns already exist, migration will fail with "duplicate column" error.
-- This is safe - the application code handles missing columns gracefully with fallback queries.
-- If migration fails, can manually mark as applied in d1_migrations table.

-- Events table
ALTER TABLE events ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;

-- Music posts table
ALTER TABLE music_posts ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;

-- Projects table
ALTER TABLE projects ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;

-- Dev logs table
ALTER TABLE dev_logs ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_is_deleted
  ON events(is_deleted);

CREATE INDEX IF NOT EXISTS idx_music_posts_is_deleted
  ON music_posts(is_deleted);

CREATE INDEX IF NOT EXISTS idx_projects_is_deleted
  ON projects(is_deleted);

CREATE INDEX IF NOT EXISTS idx_dev_logs_is_deleted
  ON dev_logs(is_deleted);
