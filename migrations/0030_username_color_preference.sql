-- 0030_username_color_preference.sql
--
-- Add preferred username color index to users table
-- NULL means use default hash-based color, 0-7 means use specific color

ALTER TABLE users ADD COLUMN preferred_username_color_index INTEGER;
