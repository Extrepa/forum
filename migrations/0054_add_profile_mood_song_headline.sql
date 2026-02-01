-- Profile mood, song, headline. If you see "duplicate column name", this migration was already applied; safe to ignore.
ALTER TABLE users ADD COLUMN profile_mood_text TEXT;
ALTER TABLE users ADD COLUMN profile_mood_emoji TEXT;
ALTER TABLE users ADD COLUMN profile_mood_updated_at INTEGER;
ALTER TABLE users ADD COLUMN profile_song_url TEXT;
ALTER TABLE users ADD COLUMN profile_song_provider TEXT;
ALTER TABLE users ADD COLUMN profile_song_autoplay_enabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN profile_headline TEXT;
