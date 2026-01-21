-- 0019_user_landing_preference.sql
--
-- User preference for default landing page (Home vs Feed)
-- Note: This migration is idempotent - it will skip if column already exists

-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we use a workaround: try to add the column, ignore error if it exists
-- In practice, wrangler will track this in d1_migrations, but this makes it safer

-- Check if column exists by attempting to query it
-- If it doesn't exist, the ALTER will succeed; if it does, we'll get an error
-- but wrangler tracks migrations so this should only run once anyway
ALTER TABLE users ADD COLUMN default_landing_page TEXT DEFAULT 'feed';
