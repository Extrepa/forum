-- 0074_music_comments_threading.sql
--
-- One-level threaded replies for music post comments.

ALTER TABLE music_comments ADD COLUMN reply_to_id TEXT;

CREATE INDEX IF NOT EXISTS idx_music_comments_reply_to
  ON music_comments(reply_to_id);
