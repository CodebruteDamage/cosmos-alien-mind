import assert from "node:assert/strict";
import test from "node:test";
import {
  authorizeWebhookEvent,
  type VerifiedWebhookIntegration,
  type WebhookAuthorizationRequest,
} from "../../lib/webhooks/authorization";

const integration: VerifiedWebhookIntegration = {
  integrationId: "integration-test-01",
  tenantId: "tenant-test-01",
  allowedEventTypes: ["ticket.created"],
  allowedOperations: ["create_ticket"],
  allowedTargetScopes: ["tenant:tenant-test-01/tickets"],
  approvalRequiredFor: ["high", "critical"],
};

const request: WebhookAuthorizationRequest = {
  eventType: "ticket.created",
  operation: "create_ticket",
  targetScope: "tenant:tenant-test-01/tickets",
  riskClass: "low",
};

test("allows a request inside the trusted integration policy", () => {
  assert.deepEqual(authorizeWebhookEvent(integration, request), {
    allowed: true,
    integrationId: "integration-test-01",
    tenantId: "tenant-test-01",
  });
});

test("denies missing integration identity", () => {
  assert.deepEqual(authorizeWebhookEvent(null, request), {
    allowed: false,
    reason: "integration_identity_missing",
  });
});

test("denies missing tenant identity", () => {
  assert.deepEqual(authorizeWebhookEvent({ ...integration, tenantId: " " }, request), {
    allowed: false,
    reason: "tenant_identity_missing",
  });
});

test("denies event types, operations, and scopes outside the allowlist", () => {
  assert.equal(authorizeWebhookEvent(integration, { ...request, eventType: "account.deleted" }).allowed, false);
  assert.equal(authorizeWebhookEvent(integration, { ...request, operation: "delete_account" }).allowed, false);
  assert.equal(authorizeWebhookEvent(integration, { ...request, targetScope: "tenant:other/data" }).allowed, false);
});

test("requires a trusted human approval for high-risk requests", () => {
  const highRisk = { ...request, riskClass: "high" as const };
  assert.deepEqual(authorizeWebhookEvent(integration, highRisk), {
    allowed: false,
    reason: "human_approval_required",
  });
  assert.deepEqual(authorizeWebhookEvent(integration, highRisk, { approved: true }), {
    allowed: false,
    reason: "approval_reference_missing",
  });
  assert.equal(
    authorizeWebhookEvent(integration, highRisk, { approved: true, approvalReference: "approval-123" }).allowed,
    true,
  );
  assert.equal(
    authorizeWebhookEvent(integration, highRisk, { approved: false, approvalReference: "approval-123" }).allowed,
    false,
  );
});
