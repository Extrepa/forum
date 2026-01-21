-- 0023_thread_views.sql
--
-- Add views tracking to forum threads

ALTER TABLE forum_threads ADD COLUMN views INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_forum_threads_views
  ON forum_threads(views);
