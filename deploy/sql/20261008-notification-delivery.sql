BEGIN;
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  language VARCHAR(255) NOT NULL DEFAULT 'ru' CHECK (language IN ('ru', 'en', 'zh')),
  last_test_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh VARCHAR(88) NOT NULL,
  auth VARCHAR(24) NOT NULL
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id ON push_subscriptions (user_id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(255);
ALTER TABLE notifications ALTER COLUMN delivery_status SET DEFAULT 'pending';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS notifications_pending_delivery ON notifications (created_at) WHERE delivery_status = 'pending';
COMMIT;
