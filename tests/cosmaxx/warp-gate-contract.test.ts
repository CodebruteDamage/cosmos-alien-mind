import assert from "node:assert/strict";
import test from "node:test";
import {
  authorizeWarpGateExecution,
  type WarpGateExecutionBinding,
  type WarpGateGrantClaims,
  type WarpGatePort,
} from "../../lib/cosmaxx/warp-gate-contract";

const NOW = Date.parse("2026-11-28T12:00:00.000Z");
const binding: WarpGateExecutionBinding = {
  actorId: "agent:orch",
  tenantId: "tenant:cosmos-test",
  workflowId: "workflow-001",
  stepId: "step-001",
  capability: "repo.write",
  action: "write",
  scope: "repository:CodebruteDamage/cosmos-alien-mind",
  parametersDigest: `sha256:${"a".repeat(64)}`,
  policyVersion: "warp-gate-policy-v1",
  risk: "moderate",
  requiresHumanApproval: false,
};

function claims(overrides: Partial<WarpGateGrantClaims> = {}): WarpGateGrantClaims {
  return {
    ...binding,
    grantId: "grant-001",
    nonce: "nonce-001",
    issuedAt: "2026-11-28T11:59:00.000Z",
    expiresAt: "2026-11-28T12:05:00.000Z",
    ...overrides,
  };
}

function gate(overrides: Partial<WarpGatePort> = {}): WarpGatePort {
  return {
    authorize: async () => ({ decision: "ALLOW", executionGrant: "signed-token" }),
    verifyAndConsume: async () => ({ valid: true, verifiedClaims: claims() }),
    ...overrides,
  };
}

const options = { now: () => NOW };

test("allows only after exact grant binding verification and consumption", async () => {
  const calls: string[] = [];
  const result = await authorizeWarpGateExecution(gate({
    authorize: async ({ binding: supplied }) => {
      calls.push("authorize");
      assert.deepEqual(supplied, binding);
      return { decision: "ALLOW", executionGrant: "signed-token" };
    },
    verifyAndConsume: async ({ executionGrant, expected }) => {
      calls.push("verify-consume");
      assert.equal(executionGrant, "signed-token");
      assert.deepEqual(expected, binding);
      return { valid: true, verifiedClaims: claims() };
    },
  }), binding, options);

  assert.equal(result.allowed, true);
  assert.deepEqual(calls, ["authorize", "verify-consume"]);
});

test("blocks a grant bound to a different tenant", async () => {
  const result = await authorizeWarpGateExecution(gate({
    verifyAndConsume: async () => ({
      valid: true,
      verifiedClaims: claims({ tenantId: "tenant:other" }),
    }),
  }), binding, options);
  assert.equal(result.allowed, false);
});

test("blocks a grant bound to different parameters or policy version", async () => {
  for (const altered of [
    claims({ parametersDigest: `sha256:${"b".repeat(64)}` }),
    claims({ policyVersion: "older-policy" }),
    claims({ scope: "repository:another-repo" }),
    claims({ actorId: "agent:untrusted" }),
  ]) {
    const result = await authorizeWarpGateExecution(gate({
      verifyAndConsume: async () => ({ valid: true, verifiedClaims: altered }),
    }), binding, options);
    assert.equal(result.allowed, false);
  }
});

test("blocks expired grants and grants with invalid nonce", async () => {
  const expired = await authorizeWarpGateExecution(gate({
    verifyAndConsume: async () => ({
      valid: true,
      verifiedClaims: claims({ expiresAt: "2026-11-28T11:59:59.000Z" }),
    }),
  }), binding, options);
  const missingNonce = await authorizeWarpGateExecution(gate({
    verifyAndConsume: async () => ({
      valid: true,
      verifiedClaims: claims({ nonce: "" }),
    }),
  }), binding, options);
  assert.equal(expired.allowed, false);
  assert.equal(missingNonce.allowed, false);
});

test("requires an approval reference for consequential work", async () => {
  const approvalBinding = { ...binding, requiresHumanApproval: true, risk: "high" as const };
  const deniedResult = await authorizeWarpGateExecution(gate({
    verifyAndConsume: async () => ({
      valid: true,
      verifiedClaims: claims({ ...approvalBinding }),
    }),
  }), approvalBinding, options);
  const allowedResult = await authorizeWarpGateExecution(gate({
    verifyAndConsume: async () => ({
      valid: true,
      verifiedClaims: claims({ ...approvalBinding, approvalId: "approval-001" }),
    }),
  }), approvalBinding, options);
  assert.equal(deniedResult.allowed, false);
  assert.equal(allowedResult.allowed, true);
});

test("fails closed for DENY, REQUIRE_APPROVAL, malformed ALLOW, and missing grant", async () => {
  for (const authorization of [
    { decision: "DENY", reason: "policy denied" },
    { decision: "REQUIRE_APPROVAL", reason: "approval required" },
    { decision: "ALLOW" },
    null,
  ]) {
    const result = await authorizeWarpGateExecution(gate({
      authorize: async () => authorization,
    }), binding, options);
    assert.equal(result.allowed, false);
  }
});

test("fails closed when authorization or verification times out", async () => {
  const authorizationTimeout = await authorizeWarpGateExecution(gate({
    authorize: async () => new Promise(() => undefined),
  }), binding, { ...options, authorizationTimeoutMs: 5 });
  const verificationTimeout = await authorizeWarpGateExecution(gate({
    verifyAndConsume: async () => new Promise(() => undefined),
  }), binding, { ...options, verificationTimeoutMs: 5 });
  assert.equal(authorizationTimeout.allowed, false);
  assert.equal(verificationTimeout.allowed, false);
});

test("rejects incomplete bindings before contacting WARP GATE", async () => {
  let called = false;
  const result = await authorizeWarpGateExecution(gate({
    authorize: async () => { called = true; return { decision: "ALLOW" }; },
  }), { ...binding, parametersDigest: "not-a-digest" }, options);
  assert.equal(result.allowed, false);
  assert.equal(called, false);
});

test("rejects a grant that expires while authorization is in progress", async () => {
  let clockCalls = 0;
  const result = await authorizeWarpGateExecution(gate(), binding, {
    now: () => {
      clockCalls += 1;
      return clockCalls === 1 ? NOW : NOW + 6 * 60_000;
    },
  });
  assert.equal(result.allowed, false);
});

test("requires approval for high and critical risk before contacting the gate", async () => {
  let called = false;
  const highRisk = { ...binding, risk: "high" as const, requiresHumanApproval: false };
  const result = await authorizeWarpGateExecution(gate({
    authorize: async () => { called = true; return { decision: "ALLOW" }; },
  }), highRisk, options);
  assert.equal(result.allowed, false);
  assert.equal(called, false);
});
