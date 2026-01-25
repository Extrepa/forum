-- 0034_posts_lock.sql
--
-- Add per-post locking to posts table (defaults unlocked).

ALTER TABLE posts ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0;
