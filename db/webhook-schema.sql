-- COSMOS Webhook durable inbox (single shared-secret integration baseline).
-- Apply manually to the intended Neon database after review.
-- This migration does not create a worker, authorize execution, or enable the route.

CREATE TABLE IF NOT EXISTS cosmos_webhook_inbox (
  event_id TEXT PRIMARY KEY CHECK (length(event_id) BETWEEN 1 AND 128),
  source TEXT NOT NULL CHECK (length(source) BETWEEN 1 AND 100),
  event_type TEXT NOT NULL CHECK (length(event_type) BETWEEN 1 AND 128),
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processing', 'processed', 'failed', 'quarantined'))
);

CREATE INDEX IF NOT EXISTS cosmos_webhook_inbox_status_received_idx
  ON cosmos_webhook_inbox (status, received_at);
