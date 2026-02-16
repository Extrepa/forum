-- 0075_dm_tables.sql
-- Private messaging: conversations, participants, messages.

CREATE TABLE IF NOT EXISTS dm_conversations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'direct',
  subject TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS dm_participants (
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  left_at INTEGER,
  PRIMARY KEY (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS dm_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (conversation_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_dm_participants_user
  ON dm_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation
  ON dm_messages(conversation_id, created_at DESC);
