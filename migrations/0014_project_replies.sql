-- 0014_project_replies.sql
--
-- Forum-style replies for projects (one-level threading via reply_to_id)

CREATE TABLE IF NOT EXISTS project_replies (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  reply_to_id TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_project_replies_project_created_at
  ON project_replies(project_id, created_at);

CREATE INDEX IF NOT EXISTS idx_project_replies_reply_to
  ON project_replies(reply_to_id);

