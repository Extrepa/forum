-- 0021_post_likes.sql
--
-- Add post likes/thumbs up functionality

CREATE TABLE IF NOT EXISTS post_likes (
  id TEXT PRIMARY KEY,
  post_type TEXT NOT NULL,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(post_type, post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post
  ON post_likes(post_type, post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_likes_user
  ON post_likes(user_id, created_at DESC);
