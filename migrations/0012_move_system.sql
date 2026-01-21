-- 0012_move_system.sql
--
-- Admin moderation move system:
-- - Track canonical moves
-- - Mark moved source content for filtering + redirects
-- - Add event comments so moves into Events can preserve discussion

CREATE TABLE IF NOT EXISTS content_moves (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  dest_type TEXT NOT NULL,
  dest_id TEXT NOT NULL,
  moved_by_user_id TEXT NOT NULL,
  moved_at INTEGER NOT NULL,
  UNIQUE(source_type, source_id),
  FOREIGN KEY (moved_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_content_moves_dest
  ON content_moves(dest_type, dest_id);

-- Add moved markers to top-level content tables
ALTER TABLE forum_threads ADD COLUMN moved_to_type TEXT;
ALTER TABLE forum_threads ADD COLUMN moved_to_id TEXT;
ALTER TABLE forum_threads ADD COLUMN moved_at INTEGER;
ALTER TABLE forum_threads ADD COLUMN moved_by_user_id TEXT;

ALTER TABLE projects ADD COLUMN moved_to_type TEXT;
ALTER TABLE projects ADD COLUMN moved_to_id TEXT;
ALTER TABLE projects ADD COLUMN moved_at INTEGER;
ALTER TABLE projects ADD COLUMN moved_by_user_id TEXT;

ALTER TABLE music_posts ADD COLUMN moved_to_type TEXT;
ALTER TABLE music_posts ADD COLUMN moved_to_id TEXT;
ALTER TABLE music_posts ADD COLUMN moved_at INTEGER;
ALTER TABLE music_posts ADD COLUMN moved_by_user_id TEXT;

ALTER TABLE timeline_updates ADD COLUMN moved_to_type TEXT;
ALTER TABLE timeline_updates ADD COLUMN moved_to_id TEXT;
ALTER TABLE timeline_updates ADD COLUMN moved_at INTEGER;
ALTER TABLE timeline_updates ADD COLUMN moved_by_user_id TEXT;

ALTER TABLE events ADD COLUMN moved_to_type TEXT;
ALTER TABLE events ADD COLUMN moved_to_id TEXT;
ALTER TABLE events ADD COLUMN moved_at INTEGER;
ALTER TABLE events ADD COLUMN moved_by_user_id TEXT;

ALTER TABLE dev_logs ADD COLUMN moved_to_type TEXT;
ALTER TABLE dev_logs ADD COLUMN moved_to_id TEXT;
ALTER TABLE dev_logs ADD COLUMN moved_at INTEGER;
ALTER TABLE dev_logs ADD COLUMN moved_by_user_id TEXT;

-- Helpful indexes for filtering lists
CREATE INDEX IF NOT EXISTS idx_forum_threads_moved_to_id
  ON forum_threads(moved_to_id);
CREATE INDEX IF NOT EXISTS idx_projects_moved_to_id
  ON projects(moved_to_id);
CREATE INDEX IF NOT EXISTS idx_music_posts_moved_to_id
  ON music_posts(moved_to_id);
CREATE INDEX IF NOT EXISTS idx_timeline_updates_moved_to_id
  ON timeline_updates(moved_to_id);
CREATE INDEX IF NOT EXISTS idx_events_moved_to_id
  ON events(moved_to_id);
CREATE INDEX IF NOT EXISTS idx_dev_logs_moved_to_id
  ON dev_logs(moved_to_id);

-- Event comments (so moved discussions can live on events)
CREATE TABLE IF NOT EXISTS event_comments (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_event_comments_event_created_at
  ON event_comments(event_id, created_at);

