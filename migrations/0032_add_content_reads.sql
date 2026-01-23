-- 0032_add_content_reads.sql
-- Generic table to track read status for all content types

CREATE TABLE IF NOT EXISTS content_reads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  last_read_at INTEGER NOT NULL,
  UNIQUE(user_id, content_type, content_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_content_reads_user_type ON content_reads(user_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_reads_content ON content_reads(content_type, content_id);
