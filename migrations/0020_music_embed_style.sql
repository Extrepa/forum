-- 0020_music_embed_style.sql
--
-- Add embed_style column to music_posts for SoundCloud player height preference

ALTER TABLE music_posts ADD COLUMN embed_style TEXT DEFAULT 'auto';
