-- COSMOS Live Data Swarm schema.
-- Apply to the intended Neon database after reviewing this migration.
-- This file is additive; it does not modify the existing conversations schema.

CREATE TABLE IF NOT EXISTS cosmos_swarm_nodes (
  node_id TEXT PRIMARY KEY CHECK (length(node_id) BETWEEN 1 AND 100),
  status TEXT NOT NULL CHECK (status IN ('online', 'degraded')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cosmos_swarm_events (
  seq BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE,
  node_id TEXT NOT NULL REFERENCES cosmos_swarm_nodes(node_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (length(event_type) BETWEEN 1 AND 80),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cosmos_swarm_events_node_seq_idx
  ON cosmos_swarm_events (node_id, seq DESC);

CREATE INDEX IF NOT EXISTS cosmos_swarm_events_created_idx
  ON cosmos_swarm_events (created_at DESC);
