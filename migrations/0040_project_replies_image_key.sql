-- 0040_project_replies_image_key.sql
--
-- Add image_key column to project_replies table to support image uploads in replies

ALTER TABLE project_replies ADD COLUMN image_key TEXT;
