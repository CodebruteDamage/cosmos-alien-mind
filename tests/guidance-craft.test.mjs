import test from "node:test";
import assert from "node:assert/strict";
import { runCraftForGuidance } from "../lib/guidance-craft.mjs";

const decision = {
  decision: "INVOKE_CRAFT",
  craftRequired: true,
  verifiedBlockerIds: ["B-1"]
};
const blocker = {
  id: "B-1",
  summary: "Provider configuration is missing",
  verified: true,
  assessment: {
    complexity: 2,
    risk: 4,
    urgency: 4,
    dependency: 3,
    confidence: 4,
    evidenceRefs: ["audit://finding/B-1"],
    source: "guidance-evidence"
  }
};

test("skips CRAFT unless guidance decision explicitly requests it", () => {
  const result = runCraftForGuidance({ ...decision, decision: "PROCEED", craftRequired: false }, [blocker]);
  assert.equal(result.invoked, false);
  assert.equal(result.status, "SKIPPED");
});

test("assesses only verified blockers selected by the guidance decision", () => {
  const result = runCraftForGuidance(decision, [
    blocker,
    { ...blocker, id: "B-2", verified: false }
  ]);
  assert.equal(result.invoked, true);
  assert.equal(result.status, "RECOMMENDATION_ONLY");
  assert.equal(result.assessments.length, 1);
  assert.equal(result.assessments[0].id, "B-1");
  assert.equal(result.requiresHumanApproval, true);
  assert.equal(result.executionStarted, false);
});

test("requests evidence instead of inventing missing assessment scores", () => {
  const result = runCraftForGuidance(decision, [{
    id: "B-1",
    summary: "Provider configuration is missing",
    verified: true
  }]);
  assert.equal(result.invoked, false);
  assert.equal(result.status, "GATHER_EVIDENCE");
  assert.deepEqual(result.missingBlockerIds, ["B-1"]);
});

test("does not assess a verified blocker absent from the decision output", () => {
  const result = runCraftForGuidance(decision, [{ ...blocker, id: "B-9" }]);
  assert.equal(result.invoked, false);
  assert.equal(result.status, "GATHER_EVIDENCE");
});
