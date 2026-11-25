import test from "node:test";
import assert from "node:assert/strict";
import { coordinateDualBrain } from "../lib/dual-brain/coordinator";
import type { BrainAdapter, BrainRequest, BrainRole } from "../lib/dual-brain/contracts";

const request = {
  requestId: "9c9cfc22-3f1d-4a12-9f91-9b79d66a51c8",
  tenantId: "tenant-test",
  userId: "user-test",
  input: "Assess the supplied implementation plan.",
  context: [{
    sourceId: "repo-readme",
    sourceType: "repository" as const,
    content: "A test source.",
    trust: "verified_source" as const,
    provenance: "GitHub repository README",
  }],
  policyVersion: "policy-v1",
  deadlineMs: 2_000,
};

function adapter(role: BrainRole, stance: "supports" | "opposes" | "uncertain" = "supports"): BrainAdapter {
  return async (input: BrainRequest) => ({
    requestId: input.requestId,
    role,
    status: "ok",
    summary: `${role} analysis`,
    claims: [{ claimId: "plan-is-safe", statement: "The plan meets the stated constraints.", stance, evidenceRefs: ["repo-readme"] }],
    uncertainties: [],
    proposedActions: ["Review the evidence before any action."],
    durationMs: 10,
    providerId: `${role}-test-adapter`,
  });
}

test("runs both brains and returns a correlated result without claiming consensus", async () => {
  const result = await coordinateDualBrain(request, {
    cosmosCore: adapter("cosmos_core"),
    alienMind: adapter("alien_mind"),
  });
  assert.equal(result.status, "complete");
  assert.deepEqual(result.availableRoles, ["cosmos_core", "alien_mind"]);
  assert.equal(result.consensusClaim, false);
  assert.equal(result.disagreements.length, 0);
});

test("preserves material disagreement for review", async () => {
  const result = await coordinateDualBrain(request, {
    cosmosCore: adapter("cosmos_core", "supports"),
    alienMind: adapter("alien_mind", "opposes"),
  });
  assert.equal(result.status, "needs_review");
  assert.equal(result.disagreements.length, 1);
  assert.equal(result.disagreements[0].claimId, "plan-is-safe");
});

test("marks a single-brain result as degraded, not dual-brain completion", async () => {
  const result = await coordinateDualBrain(request, {
    cosmosCore: adapter("cosmos_core"),
    alienMind: async () => { throw new Error("provider unavailable"); },
  });
  assert.equal(result.status, "degraded");
  assert.deepEqual(result.availableRoles, ["cosmos_core"]);
});

test("rejects a response with the wrong role or request correlation", async () => {
  const wrongRole: BrainAdapter = async (input) => ({
    requestId: input.requestId,
    role: "cosmos_core",
    status: "ok",
    summary: "wrong role",
    claims: [],
    uncertainties: [],
    proposedActions: [],
    durationMs: 1,
    providerId: "test",
  });
  const result = await coordinateDualBrain(request, {
    cosmosCore: wrongRole,
    alienMind: adapter("alien_mind"),
  });
  assert.equal(result.invocations[0].status, "error");
  assert.equal(result.invocations[0].errorCode, "CORRELATION_MISMATCH");
  assert.equal(result.status, "degraded");
});

test("rejects malformed requests before invoking either adapter", async () => {
  let calls = 0;
  const count: BrainAdapter = async () => { calls += 1; return {}; };
  await assert.rejects(
    coordinateDualBrain({ ...request, tenantId: "" }, { cosmosCore: count, alienMind: count }),
  );
  assert.equal(calls, 0);
});

test("times out a non-responsive brain and retains the other result", async () => {
  const slow: BrainAdapter = async () => new Promise(() => undefined);
  const result = await coordinateDualBrain(request, {
    cosmosCore: adapter("cosmos_core"),
    alienMind: slow,
  }, { timeoutMs: 100 });
  assert.equal(result.status, "degraded");
  assert.equal(result.invocations[1].status, "timeout");
});
