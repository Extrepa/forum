-- 0017_shared_posts.sql
--
-- Shared posts for additional sections (art, bugs, rant, nostalgia, about, lore, memories)
-- plus comments and member-only visibility.

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  image_key TEXT,
  is_private INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  FOREIGN KEY(author_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_posts_type_created_at
  ON posts(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_author_created_at
  ON posts(author_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_private_type_created_at
  ON posts(is_private, type, created_at DESC);

CREATE TABLE IF NOT EXISTS post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  reply_to_id TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(post_id) REFERENCES posts(id),
  FOREIGN KEY(author_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_created_at
  ON post_comments(post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_post_comments_reply_to
  ON post_comments(reply_to_id);

