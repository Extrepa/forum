-- 0004_music.sql

CREATE TABLE IF NOT EXISTS music_posts (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  tags TEXT,
  image_key TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS music_ratings (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES music_posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS music_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES music_posts(id),
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_music_posts_created_at
  ON music_posts(created_at);

CREATE INDEX IF NOT EXISTS idx_music_comments_post_created_at
  ON music_comments(post_id, created_at);

CREATE INDEX IF NOT EXISTS idx_music_ratings_post_id
  ON music_ratings(post_id);
