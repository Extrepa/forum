-- 0073_timeline_comments_threading.sql
--
-- One-level threaded replies for timeline (announcements) comments.

ALTER TABLE timeline_comments ADD COLUMN reply_to_id TEXT;

CREATE INDEX IF NOT EXISTS idx_timeline_comments_reply_to
  ON timeline_comments(reply_to_id);
