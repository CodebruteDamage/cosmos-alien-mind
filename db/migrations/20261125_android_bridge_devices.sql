-- COSMOS Android Bridge: device heartbeat registry.
-- Apply to the intended Neon database before enabling heartbeat registration.
-- Stores operational metadata only; never store bearer tokens here.

CREATE TABLE IF NOT EXISTS bridge_devices (
  device_id TEXT PRIMARY KEY CHECK (length(device_id) BETWEEN 3 AND 80),
  platform TEXT NOT NULL CHECK (length(platform) BETWEEN 1 AND 40),
  architecture TEXT NOT NULL CHECK (length(architecture) BETWEEN 1 AND 40),
  runtime_versions JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bridge_devices_last_seen_idx
  ON bridge_devices (last_seen_at DESC);
