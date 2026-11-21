-- COSMOS Webhook integration registry, tenant binding, and queue metadata.
-- Review and apply manually in the intended Neon database; never auto-applied.

CREATE TABLE IF NOT EXISTS cosmos_webhook_integrations (
  key_id TEXT PRIMARY KEY CHECK (length(key_id) BETWEEN 1 AND 64),
  integration_id TEXT NOT NULL UNIQUE CHECK (length(integration_id) BETWEEN 1 AND 128),
  tenant_id TEXT NOT NULL CHECK (length(tenant_id) BETWEEN 1 AND 128),
  secret_env_var TEXT NOT NULL CHECK (secret_env_var ~ '^COSMOS_WEBHOOK_SECRET_[A-Z0-9_]{1,64}$'),
  allowed_event_types TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cosmos_webhook_inbox
  ADD COLUMN IF NOT EXISTS integration_id TEXT,
  ADD COLUMN IF NOT EXISTS tenant_id TEXT,
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  ADD COLUMN IF NOT EXISTS available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error_code TEXT;

ALTER TABLE cosmos_webhook_inbox
  DROP CONSTRAINT IF EXISTS cosmos_webhook_inbox_status_check;

ALTER TABLE cosmos_webhook_inbox
  ADD CONSTRAINT cosmos_webhook_inbox_status_check
  CHECK (status IN ('received', 'processing', 'processed', 'failed', 'quarantined', 'dead_letter'));

CREATE INDEX IF NOT EXISTS cosmos_webhook_inbox_tenant_received_idx
  ON cosmos_webhook_inbox (tenant_id, status, received_at);

CREATE INDEX IF NOT EXISTS cosmos_webhook_inbox_queue_ready_idx
  ON cosmos_webhook_inbox (status, available_at, received_at)
  WHERE status IN ('received', 'failed', 'processing');

-- No integration is enabled by this migration. Secrets remain in server-side env.
-- The inbox is not executed by this schema; WARP GATE and a worker adapter remain
-- separate required runtime components.
