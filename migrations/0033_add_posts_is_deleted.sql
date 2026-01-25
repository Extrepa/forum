-- 0033_add_posts_is_deleted.sql
--
-- Add is_deleted column to posts table for soft deletion
-- This was missing from 0028_soft_delete_all_tables.sql
-- Note: If column already exists, migration will fail with "duplicate column" error.
-- This is safe - the application code handles missing columns gracefully with fallback queries.

-- Posts table
ALTER TABLE posts ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted
  ON posts(is_deleted);
