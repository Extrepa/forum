-- 0024_thread_read_tracking.sql
--
-- Track which threads users have read and where they left off

CREATE TABLE IF NOT EXISTS forum_thread_reads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  last_read_at INTEGER NOT NULL,
  last_read_reply_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (thread_id) REFERENCES forum_threads(id),
  UNIQUE(user_id, thread_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_thread_reads_user_thread
  ON forum_thread_reads(user_id, thread_id);

CREATE INDEX IF NOT EXISTS idx_forum_thread_reads_thread
  ON forum_thread_reads(thread_id);
