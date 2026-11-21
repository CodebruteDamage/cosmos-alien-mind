-- COSMOS Webhook integration registry and tenant-bound inbox extension.
-- Review and apply manually in the intended Neon database; this is not auto-applied.

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
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;

CREATE INDEX IF NOT EXISTS cosmos_webhook_inbox_tenant_received_idx
  ON cosmos_webhook_inbox (tenant_id, status, received_at);

-- No integration is enabled by this migration. Provision records explicitly
-- through a reviewed administrative process and store secrets in server env.
