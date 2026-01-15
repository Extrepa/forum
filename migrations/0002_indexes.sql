-- 0002_indexes.sql

CREATE INDEX IF NOT EXISTS idx_timeline_updates_created_at
  ON timeline_updates(created_at);

CREATE INDEX IF NOT EXISTS idx_timeline_comments_update_created_at
  ON timeline_comments(update_id, created_at);

CREATE INDEX IF NOT EXISTS idx_forum_threads_created_at
  ON forum_threads(created_at);

CREATE INDEX IF NOT EXISTS idx_forum_replies_thread_created_at
  ON forum_replies(thread_id, created_at);

CREATE INDEX IF NOT EXISTS idx_events_starts_at
  ON events(starts_at);

CREATE INDEX IF NOT EXISTS idx_reports_status_created_at
  ON reports(status, created_at);
