-- 0019_user_landing_preference.sql
--
-- User preference for default landing page (Home vs Feed)

ALTER TABLE users ADD COLUMN default_landing_page TEXT DEFAULT 'feed';
