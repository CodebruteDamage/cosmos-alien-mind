-- COSMOS governed task provisioning schema.
-- Review and apply only to the intended Neon environment after backup and approval.
-- This migration creates durable registry, task, authorization-reference and outbox tables.
-- It does not register principals/providers, create grants, or activate dispatch.

CREATE TABLE IF NOT EXISTS cosmos_task_owner_registry (
  tenant_id TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  owner_role TEXT NOT NULL,
  principal_type TEXT NOT NULL CHECK (principal_type IN ('human', 'service', 'agent')),
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'revoked')),
  implementation_id TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  attested_at TIMESTAMPTZ NOT NULL,
  attestation_expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, principal_id),
  CHECK (attestation_expires_at > attested_at),
  CHECK ((status = 'revoked') = (revoked_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS cosmos_task_owner_lookup_idx
  ON cosmos_task_owner_registry (tenant_id, subject_key, owner_role, status, attestation_expires_at);

CREATE TABLE IF NOT EXISTS cosmos_execution_provider_registry (
  tenant_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  implementation_id TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'revoked')),
  evidence_ref TEXT NOT NULL,
  attested_at TIMESTAMPTZ NOT NULL,
  attestation_expires_at TIMESTAMPTZ NOT NULL,
  last_health_check_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, provider_id),
  CHECK (attestation_expires_at > attested_at),
  CHECK ((status = 'revoked') = (revoked_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS cosmos_execution_provider_lookup_idx
  ON cosmos_execution_provider_registry (tenant_id, environment, status, attestation_expires_at);

CREATE TABLE IF NOT EXISTS cosmos_tasks (
  task_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  parent_task_id TEXT,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_by_subject TEXT NOT NULL,
  objective TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  alignment_rationale TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  risk TEXT NOT NULL CHECK (risk IN ('read_only', 'side_effect', 'consequential')),
  required_capabilities TEXT[] NOT NULL,
  acceptance_criteria JSONB NOT NULL CHECK (jsonb_typeof(acceptance_criteria) = 'array'),
  scope_contract JSONB NOT NULL CHECK (jsonb_typeof(scope_contract) = 'object'),
  task_owner_principal_id TEXT NOT NULL,
  execution_provider_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'CREATED' CHECK (state IN (
    'CREATED', 'INTAKE', 'OWNED', 'PRESCANNED', 'ANALYZED', 'PLANNED',
    'AWAITING_APPROVAL', 'AUTHORIZED', 'EXECUTING', 'VALIDATING', 'COMPLETED',
    'BLOCKED', 'REJECTED', 'NEEDS_REAPPROVAL', 'RECOVERING', 'FAILED', 'CANCELLED'
  )),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, task_id),
  FOREIGN KEY (tenant_id, task_owner_principal_id)
    REFERENCES cosmos_task_owner_registry (tenant_id, principal_id),
  FOREIGN KEY (tenant_id, execution_provider_id)
    REFERENCES cosmos_execution_provider_registry (tenant_id, provider_id),
  FOREIGN KEY (tenant_id, parent_task_id)
    REFERENCES cosmos_tasks (tenant_id, task_id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS cosmos_tasks_tenant_state_updated_idx
  ON cosmos_tasks (tenant_id, state, updated_at DESC);

CREATE TABLE IF NOT EXISTS cosmos_warp_gate_decisions (
  decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('read', 'write', 'delete', 'external')),
  scope TEXT NOT NULL,
  parameters_digest TEXT NOT NULL CHECK (parameters_digest ~ '^sha256:[a-fA-F0-9]{64}$'),
  policy_version TEXT NOT NULL,
  risk TEXT NOT NULL CHECK (risk IN ('low', 'moderate', 'high', 'critical')),
  decision TEXT NOT NULL CHECK (decision IN ('ALLOW', 'DENY', 'REQUIRE_APPROVAL', 'BLOCKED')),
  grant_reference TEXT,
  approval_reference TEXT,
  nonce_digest TEXT,
  grant_expires_at TIMESTAMPTZ,
  evidence_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (decision <> 'ALLOW' OR (grant_reference IS NOT NULL AND grant_expires_at IS NOT NULL)),
  CHECK (risk NOT IN ('high', 'critical') OR approval_reference IS NOT NULL OR decision <> 'ALLOW'),
  FOREIGN KEY (tenant_id, task_id) REFERENCES cosmos_tasks (tenant_id, task_id)
);

CREATE INDEX IF NOT EXISTS cosmos_warp_gate_task_decision_idx
  ON cosmos_warp_gate_decisions (tenant_id, task_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cosmos_task_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  actor_subject TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  reason TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence_refs) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (tenant_id, task_id) REFERENCES cosmos_tasks (tenant_id, task_id)
);

CREATE INDEX IF NOT EXISTS cosmos_task_events_timeline_idx
  ON cosmos_task_events (tenant_id, task_id, created_at, event_id);

CREATE TABLE IF NOT EXISTS cosmos_task_outbox (
  outbox_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  authorization_decision_id UUID NOT NULL REFERENCES cosmos_warp_gate_decisions(decision_id),
  idempotency_key TEXT NOT NULL,
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'delivered', 'dead')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_by TEXT,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, idempotency_key),
  FOREIGN KEY (tenant_id, task_id) REFERENCES cosmos_tasks (tenant_id, task_id)
);

CREATE INDEX IF NOT EXISTS cosmos_task_outbox_claim_idx
  ON cosmos_task_outbox (status, available_at, locked_until);

CREATE OR REPLACE FUNCTION cosmos_guard_task_outbox_authorization()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  task_state TEXT;
  decision_record RECORD;
BEGIN
  SELECT state INTO task_state
    FROM cosmos_tasks
    WHERE tenant_id = NEW.tenant_id AND task_id = NEW.task_id;

  IF task_state IS DISTINCT FROM 'AUTHORIZED' THEN
    RAISE EXCEPTION 'Task must be AUTHORIZED before entering the dispatch outbox';
  END IF;

  SELECT decision, tenant_id, task_id, grant_expires_at
    INTO decision_record
    FROM cosmos_warp_gate_decisions
    WHERE decision_id = NEW.authorization_decision_id;

  IF decision_record.decision IS DISTINCT FROM 'ALLOW'
     OR decision_record.tenant_id IS DISTINCT FROM NEW.tenant_id
     OR decision_record.task_id IS DISTINCT FROM NEW.task_id
     OR decision_record.grant_expires_at IS NULL
     OR decision_record.grant_expires_at <= NOW() THEN
    RAISE EXCEPTION 'A current, task-bound WARP GATE ALLOW decision is required';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cosmos_task_outbox_authorization_guard ON cosmos_task_outbox;
CREATE TRIGGER cosmos_task_outbox_authorization_guard
  BEFORE INSERT ON cosmos_task_outbox
  FOR EACH ROW EXECUTE FUNCTION cosmos_guard_task_outbox_authorization();

CREATE OR REPLACE FUNCTION cosmos_reject_immutable_row_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'COSMOS audit and lifecycle records are append-only';
END;
$$;

DROP TRIGGER IF EXISTS cosmos_task_events_immutable ON cosmos_task_events;
CREATE TRIGGER cosmos_task_events_immutable
  BEFORE UPDATE OR DELETE ON cosmos_task_events
  FOR EACH ROW EXECUTE FUNCTION cosmos_reject_immutable_row_mutation();

DROP TRIGGER IF EXISTS cosmos_warp_gate_decisions_immutable ON cosmos_warp_gate_decisions;
CREATE TRIGGER cosmos_warp_gate_decisions_immutable
  BEFORE UPDATE OR DELETE ON cosmos_warp_gate_decisions
  FOR EACH ROW EXECUTE FUNCTION cosmos_reject_immutable_row_mutation();
