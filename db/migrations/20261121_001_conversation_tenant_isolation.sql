-- COSMOS API Security T2: tenant and owner scoping.
-- Apply to the intended Neon database before enabling authenticated
-- conversation routes. Existing rows remain NULL and are intentionally
-- invisible to tenant-scoped reads until explicitly reviewed/backfilled.
-- This migration does not assign legacy conversations to arbitrary users.

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS tenant_id TEXT,
  ADD COLUMN IF NOT EXISTS owner_subject TEXT;

CREATE INDEX IF NOT EXISTS conversations_tenant_owner_updated_idx
  ON conversations (tenant_id, owner_subject, updated_at DESC)
  WHERE tenant_id IS NOT NULL AND owner_subject IS NOT NULL;

-- Existing legacy rows are intentionally retained but are not readable
-- through the new tenant-scoped API because their ownership is unknown.
