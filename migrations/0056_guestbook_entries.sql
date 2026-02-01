-- Guestbook: messages left by visitors on a user's profile
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_guestbook_entries_owner_created
  ON guestbook_entries(owner_user_id, created_at DESC);
