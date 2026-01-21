-- 0010_devlog.sql
--
-- Dev Log (admin-only section)

CREATE TABLE IF NOT EXISTS dev_logs (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS dev_log_comments (
  id TEXT PRIMARY KEY,
  log_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (log_id) REFERENCES dev_logs(id),
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_dev_logs_created_at
  ON dev_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_dev_log_comments_log_created_at
  ON dev_log_comments(log_id, created_at);
