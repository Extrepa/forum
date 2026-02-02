-- Profile cover image mode. If you see "duplicate column name", this migration was already applied; safe to ignore.
ALTER TABLE users ADD COLUMN profile_cover_mode TEXT;
