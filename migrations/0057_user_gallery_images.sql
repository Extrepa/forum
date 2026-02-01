-- User profile gallery: images uploaded by the user, optional cover photo
CREATE TABLE IF NOT EXISTS user_gallery_images (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_key TEXT NOT NULL,
  caption TEXT,
  is_cover INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_gallery_images_user_created
  ON user_gallery_images(user_id, created_at DESC);
