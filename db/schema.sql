-- Cosmos Alien Mind MVP schema (PostgreSQL / Neon)
-- Apply this file to the intended Neon database before using conversation APIs.

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New conversation',
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

-- Hybrid runtime node registry. Store only operational metadata, never secrets.
CREATE TABLE IF NOT EXISTS cosmos_nodes (
  node_id TEXT PRIMARY KEY CHECK (length(node_id) BETWEEN 1 AND 128),
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 100),
  runtime TEXT NOT NULL CHECK (runtime IN ('local-pc', 'web', 'mobile', 'service')),
  status TEXT NOT NULL CHECK (status IN ('online', 'degraded', 'offline')),
  version TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS cosmos_nodes_last_seen_idx ON cosmos_nodes (last_seen_at DESC);

CREATE TABLE IF NOT EXISTS cosmos_node_events (
  id BIGSERIAL PRIMARY KEY,
  node_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('heartbeat', 'status')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS cosmos_node_events_created_idx ON cosmos_node_events (created_at DESC);
