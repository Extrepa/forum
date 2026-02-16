-- 0070_event_comments_threading.sql
--
-- One-level threaded replies for event comments (nested reply under a comment).

ALTER TABLE event_comments ADD COLUMN reply_to_id TEXT;

CREATE INDEX IF NOT EXISTS idx_event_comments_reply_to
  ON event_comments(reply_to_id);
