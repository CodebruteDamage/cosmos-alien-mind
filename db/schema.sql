-- Cosmos Alien Mind MVP schema (PostgreSQL / Neon)
-- Apply this file to the intended Neon database before using conversation APIs.

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New conversation',
  tenant_id TEXT NOT NULL,
  owner_subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 20000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS conversations_updated_idx
  ON conversations (updated_at DESC);

CREATE INDEX IF NOT EXISTS conversations_tenant_owner_updated_idx
  ON conversations (tenant_id, owner_subject, updated_at DESC);
