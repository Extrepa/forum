-- 0046_add_user_avatar.sql
--
-- Add avatar fields to users table for custom SVG avatars

ALTER TABLE users ADD COLUMN avatar_key TEXT;
ALTER TABLE users ADD COLUMN avatar_state TEXT;
