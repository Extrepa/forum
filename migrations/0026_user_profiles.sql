-- 0026_user_profiles.sql
--
-- Add profile fields to users table for public profile customization

ALTER TABLE users ADD COLUMN profile_bio TEXT;
ALTER TABLE users ADD COLUMN profile_links TEXT;
