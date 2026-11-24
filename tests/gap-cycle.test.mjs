import test from "node:test";
import assert from "node:assert/strict";
import { evaluateGapTransition, GAP_CYCLE_STAGES } from "../lib/gap-cycle.ts";

const base = {
  currentStageId: "OPTIMIZATION",
  nextStageId: "PROVISION",
  objective: "Integrate the governed 12 GAP lifecycle",
  evidenceRefs: ["github://commit/abc123"],
  rationale: "",
  scopeApproved: true,
  dependenciesSatisfied: true,
  riskClass: "R1",
  approvalValid: false,
  testsPassed: true,
  acceptanceCriteriaSatisfied: true,
  stopRequested: false,
};

test("exposes the canonical twelve stages in order", () => {
  assert.equal(GAP_CYCLE_STAGES.length, 12);
  assert.deepEqual(GAP_CYCLE_STAGES.map((stage) => stage.id), [
    "GAP", "ANALYSIS", "PARALYSIS", "ROOT_CAUSE", "SHAPE", "OPTIMIZATION",
    "PROVISION", "BUILD", "TEST", "VALIDATE", "CLOSE", "EVOLVE",
  ]);
});

test("advances sequentially when evidence and gates are satisfied", () => {
  assert.equal(evaluateGapTransition(base).status, "ADVANCE");
});

test("holds when a stage is skipped", () => {
  const result = evaluateGapTransition({ ...base, nextStageId: "BUILD" });
  assert.equal(result.allowed, false);
  assert.equal(result.status, "HOLD");
});

test("holds at PROVISION when dependencies are not ready", () => {
  const result = evaluateGapTransition({ ...base, dependenciesSatisfied: false });
  assert.ok(result.requiredEvidence.includes("verified dependency readiness"));
});

test("requires scope authorization and action-specific approval for risky builds", () => {
  const result = evaluateGapTransition({ ...base, currentStageId: "PROVISION", nextStageId: "BUILD", riskClass: "R3", scopeApproved: false });
  assert.equal(result.allowed, false);
  assert.ok(result.requiredEvidence.includes("explicit in-scope build authorization"));
  assert.ok(result.requiredEvidence.includes("action-specific approval for R2/R3 work"));
});

test("does not advance to VALIDATE without passing tests", () => {
  const result = evaluateGapTransition({ ...base, currentStageId: "TEST", nextStageId: "VALIDATE", testsPassed: false });
  assert.equal(result.allowed, false);
});

test("does not close without acceptance criteria", () => {
  const result = evaluateGapTransition({ ...base, currentStageId: "VALIDATE", nextStageId: "CLOSE", acceptanceCriteriaSatisfied: false });
  assert.equal(result.allowed, false);
});

test("allows evidence-backed backward iteration with a rationale", () => {
  const result = evaluateGapTransition({ ...base, currentStageId: "VALIDATE", nextStageId: "ROOT_CAUSE", rationale: "Validation found an unresolved root cause." });
  assert.equal(result.status, "REWIND");
});

test("stops immediately when requested", () => {
  const result = evaluateGapTransition({ ...base, stopRequested: true });
  assert.equal(result.status, "STOP");
});

test("requires evidence to pass a completed stage", () => {
  const result = evaluateGapTransition({ ...base, evidenceRefs: [] });
  assert.equal(result.allowed, false);
  assert.equal(result.status, "HOLD");
});
