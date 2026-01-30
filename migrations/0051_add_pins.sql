-- 0051_add_pins.sql
--
-- Add is_pinned to content tables that don't have it yet.
-- forum_threads and timeline_updates already have is_pinned from 0001_init.

ALTER TABLE posts ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE music_posts ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE dev_logs ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
