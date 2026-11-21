import assert from "node:assert/strict";
import test from "node:test";
import {
  processClaimedWebhookEvent,
  type WebhookWorkerDependencies,
} from "../../lib/webhooks/worker";
import type { ClaimedWebhookEvent } from "../../lib/webhooks/queue";
import type { WebhookIntegrationRecord } from "../../lib/webhooks/registry";

const event: ClaimedWebhookEvent = {
  event_id: "evt-100",
  integration_id: "integration-a",
  tenant_id: "tenant-a",
  event_type: "ticket.created",
  payload: { ticket: "T-100" },
  attempts: 1,
};

const integration: WebhookIntegrationRecord = {
  integrationId: "integration-a",
  tenantId: "tenant-a",
  secretEnvVar: "COSMOS_WEBHOOK_SECRET_SUPPORT",
  allowedEventTypes: ["ticket.created"],
  allowedOperations: ["create_ticket"],
  allowedTargetScopes: ["tenant:tenant-a/tickets"],
  approvalRequiredFor: ["high", "critical"],
  eventPolicies: {
    "ticket.created": {
      operation: "create_ticket",
      targetScope: "tenant:tenant-a/tickets",
      riskClass: "low",
    },
  },
  enabled: true,
};

function dependencies(overrides: Partial<WebhookWorkerDependencies> = {}) {
  const calls = {
    executed: 0,
    audited: 0,
    quarantined: 0,
    retried: 0,
    completed: 0,
    idempotencyKey: "",
  };
  const base: WebhookWorkerDependencies = {
    loadIntegration: async () => integration,
    recordDecision: async () => { calls.audited += 1; },
    isOperationRegistered: () => true,
    execute: async (_event, _policy, _authorization, key) => {
      calls.executed += 1;
      calls.idempotencyKey = key;
    },
    markProcessed: async () => { calls.completed += 1; return true; },
    quarantine: async () => { calls.quarantined += 1; return true; },
    scheduleRetry: async () => { calls.retried += 1; },
    ...overrides,
  };
  return { calls, dependencies: base };
}

test("re-evaluates current policy before idempotent dispatch", async () => {
  const { calls, dependencies: deps } = dependencies();
  const result = await processClaimedWebhookEvent(event, deps);
  assert.deepEqual(result, { eventId: "evt-100", status: "processed" });
  assert.equal(calls.audited, 1);
  assert.equal(calls.executed, 1);
  assert.equal(calls.completed, 1);
  assert.equal(calls.idempotencyKey, "evt-100");
});

test("denies cross-tenant events before execution", async () => {
  const { calls, dependencies: deps } = dependencies({
    loadIntegration: async () => ({ ...integration, tenantId: "tenant-b" }),
  });
  const result = await processClaimedWebhookEvent(event, deps);
  assert.deepEqual(result, {
    eventId: "evt-100",
    status: "denied",
    reason: "tenant_identity_mismatch",
  });
  assert.equal(calls.executed, 0);
  assert.equal(calls.quarantined, 1);
});

test("denies high-risk events when trusted approval is unavailable", async () => {
  const highRiskIntegration = {
    ...integration,
    eventPolicies: {
      "ticket.created": {
        operation: "create_ticket",
        targetScope: "tenant:tenant-a/tickets",
        riskClass: "high" as const,
      },
    },
  };
  const { calls, dependencies: deps } = dependencies({
    loadIntegration: async () => highRiskIntegration,
  });
  const result = await processClaimedWebhookEvent(event, deps);
  assert.deepEqual(result, {
    eventId: "evt-100",
    status: "denied",
    reason: "human_approval_required",
  });
  assert.equal(calls.executed, 0);
});

test("denies operations without a registered handler", async () => {
  const { calls, dependencies: deps } = dependencies({
    isOperationRegistered: () => false,
  });
  const result = await processClaimedWebhookEvent(event, deps);
  assert.deepEqual(result, {
    eventId: "evt-100",
    status: "denied",
    reason: "operation_handler_unavailable",
  });
  assert.equal(calls.executed, 0);
  assert.equal(calls.quarantined, 1);
});

test("does not dispatch when the audit service is unavailable", async () => {
  const { calls, dependencies: deps } = dependencies({
    recordDecision: async () => { throw new Error("audit unavailable"); },
  });
  const result = await processClaimedWebhookEvent(event, deps);
  assert.deepEqual(result, {
    eventId: "evt-100",
    status: "retry_scheduled",
    reason: "audit_unavailable",
  });
  assert.equal(calls.executed, 0);
  assert.equal(calls.retried, 1);
});

test("retries handler failures instead of marking events processed", async () => {
  const { calls, dependencies: deps } = dependencies({
    execute: async () => { throw new Error("handler failure"); },
  });
  const result = await processClaimedWebhookEvent(event, deps);
  assert.deepEqual(result, {
    eventId: "evt-100",
    status: "retry_scheduled",
    reason: "handler_failed",
  });
  assert.equal(calls.completed, 0);
  assert.equal(calls.retried, 1);
});

test("fails closed when current registry data cannot be loaded", async () => {
  const { calls, dependencies: deps } = dependencies({
    loadIntegration: async () => { throw new Error("database unavailable"); },
  });
  const result = await processClaimedWebhookEvent(event, deps);
  assert.deepEqual(result, {
    eventId: "evt-100",
    status: "retry_scheduled",
    reason: "registry_unavailable",
  });
  assert.equal(calls.executed, 0);
});
