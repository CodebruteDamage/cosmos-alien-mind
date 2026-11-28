-- Apply only after review to the intended Neon database.
-- Legacy rows remain unowned and are intentionally excluded from tenant-scoped APIs.
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS tenant_id TEXT,
  ADD COLUMN IF NOT EXISTS owner_subject TEXT;

CREATE INDEX IF NOT EXISTS conversations_tenant_owner_updated_idx
  ON conversations (tenant_id, owner_subject, updated_at DESC)
  WHERE tenant_id IS NOT NULL AND owner_subject IS NOT NULL;
