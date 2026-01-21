-- 0027_forum_threads_soft_delete.sql
--
-- Add is_deleted column to forum_threads for soft deletion

ALTER TABLE forum_threads ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_forum_threads_is_deleted
  ON forum_threads(is_deleted);
