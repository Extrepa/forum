-- Add phone number support for SMS notifications.
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN phone_norm TEXT;

-- Optional uniqueness (only when present).
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_norm ON users(phone_norm) WHERE phone_norm IS NOT NULL;

