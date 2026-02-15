-- 0066_drip_nomads_and_visibility.sql
-- Adds role/visibility support for Drip Nomads.

ALTER TABLE posts ADD COLUMN visibility_scope TEXT NOT NULL DEFAULT 'members';
ALTER TABLE posts ADD COLUMN section_scope TEXT NOT NULL DEFAULT 'default';
ALTER TABLE posts ADD COLUMN nomad_post_kind TEXT DEFAULT 'post';

ALTER TABLE events ADD COLUMN visibility_scope TEXT NOT NULL DEFAULT 'members';
ALTER TABLE events ADD COLUMN section_scope TEXT NOT NULL DEFAULT 'default';
ALTER TABLE events ADD COLUMN event_kind TEXT DEFAULT 'general';

CREATE INDEX IF NOT EXISTS idx_posts_section_visibility_created_at
  ON posts(section_scope, visibility_scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_section_visibility_created_at
  ON events(section_scope, visibility_scope, created_at DESC);
