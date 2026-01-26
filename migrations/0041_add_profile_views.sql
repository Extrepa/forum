-- 0041_add_profile_views.sql

ALTER TABLE users ADD COLUMN profile_views INTEGER NOT NULL DEFAULT 0;
