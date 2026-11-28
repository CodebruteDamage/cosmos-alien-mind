import assert from "node:assert/strict";
import test from "node:test";
import { evaluateTaskTransition } from "../../lib/orchestration/task-ledger";

const base = {
  actorSubject: "user:operator-1",
  reason: "Acceptance evidence recorded",
  expectedVersion: 2,
};

test("accepts the normal lifecycle sequence one step at a time", () => {
  const result = evaluateTaskTransition({ ...base, from: "CREATED", to: "INTAKE" });
  assert.equal(result.allowed, true);
  if (result.allowed) assert.equal(result.nextVersion, 3);
});

test("rejects skipped lifecycle gates", () => {
  const result = evaluateTaskTransition({ ...base, from: "CREATED", to: "EXECUTING" });
  assert.equal(result.allowed, false);
});

test("requires verified WARP GATE authorization before AUTHORIZED", () => {
  const denied = evaluateTaskTransition({ ...base, from: "AWAITING_APPROVAL", to: "AUTHORIZED" });
  const allowed = evaluateTaskTransition({
    ...base, from: "AWAITING_APPROVAL", to: "AUTHORIZED",
    warpGateDecisionVerified: true, humanApprovalVerified: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(allowed.allowed, true);
});

test("requires independent validation and audit before completion", () => {
  const denied = evaluateTaskTransition({ ...base, from: "VALIDATING", to: "COMPLETED", validationPassed: true });
  const allowed = evaluateTaskTransition({
    ...base, from: "VALIDATING", to: "COMPLETED",
    validationPassed: true, auditPassed: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(allowed.allowed, true);
});

test("terminal states cannot be reopened", () => {
  const result = evaluateTaskTransition({ ...base, from: "COMPLETED", to: "RECOVERING" });
  assert.equal(result.allowed, false);
});
