-- COSMOS Webhook integration registry, tenant binding, queue, and decision audit.
-- Review and apply manually in the intended Neon database; never auto-applied.

CREATE TABLE IF NOT EXISTS cosmos_webhook_integrations (
  key_id TEXT PRIMARY KEY CHECK (length(key_id) BETWEEN 1 AND 64),
  integration_id TEXT NOT NULL UNIQUE CHECK (length(integration_id) BETWEEN 1 AND 128),
  tenant_id TEXT NOT NULL CHECK (length(tenant_id) BETWEEN 1 AND 128),
  secret_env_var TEXT NOT NULL CHECK (secret_env_var ~ '^COSMOS_WEBHOOK_SECRET_[A-Z0-9_]{1,64}$'),
  allowed_event_types TEXT[] NOT NULL DEFAULT '{}',
  event_policies JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cosmos_webhook_integrations
  ADD COLUMN IF NOT EXISTS event_policies JSONB NOT NULL DEFAULT '{}'::jsonb;

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

CREATE TABLE IF NOT EXISTS cosmos_webhook_authorization_audit (
  audit_id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL,
  integration_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  decision_stage TEXT NOT NULL CHECK (decision_stage IN ('ingress', 'dispatch')),
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'deny')),
  reason_code TEXT NOT NULL,
  approval_reference TEXT,
  policy_version TEXT NOT NULL DEFAULT 'webhook-policy-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cosmos_webhook_authorization_audit
  ADD COLUMN IF NOT EXISTS decision_stage TEXT NOT NULL DEFAULT 'ingress',
  ADD COLUMN IF NOT EXISTS approval_reference TEXT;

ALTER TABLE cosmos_webhook_authorization_audit
  DROP CONSTRAINT IF EXISTS cosmos_webhook_authorization_audit_integration_id_event_id_decision_key;

DROP INDEX IF EXISTS cosmos_webhook_audit_event_stage_idx;
CREATE INDEX IF NOT EXISTS cosmos_webhook_audit_event_stage_idx
  ON cosmos_webhook_authorization_audit (integration_id, event_id, decision_stage, created_at);

CREATE INDEX IF NOT EXISTS cosmos_webhook_inbox_tenant_received_idx
  ON cosmos_webhook_inbox (tenant_id, status, received_at);

CREATE INDEX IF NOT EXISTS cosmos_webhook_inbox_queue_ready_idx
  ON cosmos_webhook_inbox (status, available_at, received_at)
  WHERE status IN ('received', 'failed', 'processing');

CREATE INDEX IF NOT EXISTS cosmos_webhook_audit_tenant_created_idx
  ON cosmos_webhook_authorization_audit (tenant_id, created_at);

-- No integration is enabled by this migration. Secrets remain in server-side env.
-- Audit history is append-oriented; enforce DB-level immutability with restricted
-- database roles before production use. Do not grant UPDATE/DELETE to app workers.
