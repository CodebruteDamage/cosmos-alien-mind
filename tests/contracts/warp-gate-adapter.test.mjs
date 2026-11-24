import test from "node:test";
import assert from "node:assert/strict";
import { authorizeLifecycle } from "../../lib/governance/warp-gate-adapter.ts";

const request = {
  requestId: "req-1", executionId: "exec-1", tenantId: "tenant-1",
  subjectId: "subject-1", lifecycleId: "life-1", capability: "cosmos.lifecycle",
  action: "advance", targetScope: ["lifecycle:life-1"], fromStage: "DISCOVERY",
  toStage: "ANALYSIS", reason: "test", evidenceRefs: [],
  policyVersion: "p1", traceId: "trace-1",
};

function client(decision = "ALLOW", overrides = {}) {
  return { authorize: async () => ({
    decision, reason: "test_decision",
    record: {
      requestId: request.requestId, executionId: request.executionId,
      decision, reason: "test_decision", policyVersion: request.policyVersion,
      principalId: request.subjectId, tenantId: request.tenantId,
      grantId: "grant-1", decidedAt: new Date().toISOString(),
      ...overrides,
    },
    executionGrant: "opaque-test-grant",
  }), verifyAndConsumeGrant: async () => true };
}

test("accepts explicit ALLOW with matching decision record and grant", async () => {
  const result = await authorizeLifecycle(client(), request);
  assert.equal(result.authorized, true);
});

test("does not authorize REQUIRE_APPROVAL", async () => {
  const result = await authorizeLifecycle(client("REQUIRE_APPROVAL"), request);
  assert.equal(result.authorized, false);
  assert.equal(result.decision, "REQUIRE_APPROVAL");
});

test("does not authorize DENY or BLOCKED", async () => {
  for (const decision of ["DENY", "BLOCKED"]) {
    const result = await authorizeLifecycle(client(decision), request);
    assert.equal(result.authorized, false);
  }
});

test("fails closed on mismatched tenant/principal context", async () => {
  const result = await authorizeLifecycle(client("ALLOW", { tenantId: "other-tenant" }), request);
  assert.equal(result.authorized, false);
  assert.equal(result.reason, "warp_gate_response_invalid");
});

test("fails closed when execution grant is absent", async () => {
  const result = await authorizeLifecycle({
    authorize: async () => ({ ...await client().authorize(), executionGrant: null }),
  }, request);
  assert.equal(result.authorized, false);
  assert.equal(result.reason, "execution_grant_missing");
});

test("fails closed when execution grant verification fails", async () => {
  const base = client();
  const result = await authorizeLifecycle({
    authorize: base.authorize,
    verifyAndConsumeGrant: async () => false,
  }, request);
  assert.equal(result.authorized, false);
  assert.equal(result.reason, "execution_grant_invalid");
});

test("fails closed when WARP GATE is unavailable", async () => {
  const result = await authorizeLifecycle({ authorize: async () => { throw new Error("offline"); }, verifyAndConsumeGrant: async () => false }, request);
  assert.equal(result.authorized, false);
  assert.equal(result.decision, "BLOCKED");
});
