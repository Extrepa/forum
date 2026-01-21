-- 0025_thread_announcements.sql
--
-- Add explicit announcement flag to forum threads
-- Note: We can also derive announcements from author.role = 'admin', but this provides flexibility

ALTER TABLE forum_threads ADD COLUMN is_announcement INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_forum_threads_announcement
  ON forum_threads(is_announcement);
