-- 0029_forum_replies_threading.sql
--
-- Add reply_to_id column to forum_replies for one-level threading (nested replies)

ALTER TABLE forum_replies ADD COLUMN reply_to_id TEXT;

CREATE INDEX IF NOT EXISTS idx_forum_replies_reply_to
  ON forum_replies(reply_to_id);
