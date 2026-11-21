import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidSecretEnvVar,
  parseEventPolicies,
} from "../../lib/webhooks/registry";

test("accepts only server-side COSMOS webhook secret variable references", () => {
  assert.equal(isValidSecretEnvVar("COSMOS_WEBHOOK_SECRET_SUPPORT_APP"), true);
  assert.equal(isValidSecretEnvVar("COSMOS_WEBHOOK_SECRET_A1"), true);
});

test("rejects arbitrary, public, and malformed environment variable references", () => {
  for (const value of [
    "DATABASE_URL",
    "NEXT_PUBLIC_COSMOS_WEBHOOK_SECRET_KEY",
    "COSMOS_WEBHOOK_SECRET_",
    "COSMOS_WEBHOOK_SECRET_bad-name",
    "COSMOS_WEBHOOK_SECRET_A".repeat(10),
    "",
  ]) assert.equal(isValidSecretEnvVar(value), false, value);
});

test("accepts valid tenant-bound server-side event policies", () => {
  assert.deepEqual(parseEventPolicies({
    "ticket.created": {
      operation: "create_ticket",
      targetScope: "tenant:tenant-a/tickets",
      riskClass: "low",
    },
  }, "tenant-a"), {
    "ticket.created": {
      operation: "create_ticket",
      targetScope: "tenant:tenant-a/tickets",
      riskClass: "low",
    },
  });
});

test("rejects cross-tenant scopes and malformed event policy fields", () => {
  assert.equal(parseEventPolicies({
    "ticket.created": {
      operation: "create_ticket",
      targetScope: "tenant:tenant-b/tickets",
      riskClass: "low",
    },
  }, "tenant-a"), null);
  assert.equal(parseEventPolicies({
    "ticket.created": {
      operation: "delete_all",
      targetScope: "tenant:tenant-a/tickets",
      riskClass: "untrusted",
    },
  }, "tenant-a"), null);
  assert.equal(parseEventPolicies([], "tenant-a"), null);
});
