-- 0015_devlog_threaded_replies.sql
--
-- One-level threaded replies for dev log discussions.

ALTER TABLE dev_log_comments ADD COLUMN reply_to_id TEXT;

CREATE INDEX IF NOT EXISTS idx_dev_log_comments_reply_to
  ON dev_log_comments(reply_to_id);

