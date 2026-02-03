-- Add profile visibility/presentation preferences (show role + song glow)
-- If you see "duplicate column name", the migration already ran and can be ignored.
ALTER TABLE users ADD COLUMN profile_show_role INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN profile_song_provider_glow INTEGER DEFAULT 1;
