import test from "node:test";
import assert from "node:assert/strict";
import { assessBlocker, assessBlockers } from "../index.mjs";

const sample = {
  id: "B-1",
  summary: "Provider configuration is missing",
  complexity: 2,
  risk: 4,
  urgency: 4,
  dependency: 3,
  confidence: 4,
  evidenceRefs: ["audit://finding/B-1"]
};

test("assesses a blocker with deterministic weighted score", () => {
  const result = assessBlocker(sample);
  assert.equal(result.priorityScore, 3.4);
  assert.equal(result.priority, "high");
  assert.equal(result.decision, "recommendation_only");
  assert.equal(result.requiresHumanApproval, true);
});

test("requires evidence when confidence is below three", () => {
  const result = assessBlocker({ ...sample, confidence: 2 });
  assert.equal(result.evidenceRequired, true);
  assert.match(result.recommendedNextStep, /evidence/i);
});

test("requires evidence references before remediation planning", () => {
  const result = assessBlocker({ ...sample, evidenceRefs: [] });
  assert.equal(result.evidenceRequired, true);
});

test("rejects missing dimensions and out-of-range scores", () => {
  assert.throws(() => assessBlocker({ ...sample, risk: undefined }), /risk/);
  assert.throws(() => assessBlocker({ ...sample, urgency: 6 }), /urgency/);
});

test("preserves 12 GAP Cycle and evidence references without interpreting them", () => {
  const result = assessBlocker({
    ...sample,
    gapCycleId: "cycle-01",
    gapStageId: "stage-ref"
  });
  assert.equal(result.context.gapCycleId, "cycle-01");
  assert.equal(result.context.gapStageId, "stage-ref");
  assert.deepEqual(result.context.evidenceRefs, ["audit://finding/B-1"]);
});

test("sorts batch assessments by priority score descending", () => {
  const results = assessBlockers([
    { ...sample, id: "low", risk: 1, urgency: 1, complexity: 1, dependency: 1 },
    { ...sample, id: "high", risk: 5, urgency: 5, complexity: 5, dependency: 5 }
  ]);
  assert.equal(results[0].id, "high");
  assert.equal(results[1].id, "low");
});
