import test from "node:test";
import assert from "node:assert/strict";
import { decideGuidance } from "../lib/guidance-decision.ts";

const base = {
  objective: "Resolve the approved integration issue",
  objectiveSatisfied: false,
  guidance: {
    recommendation: "Inspect the integration and recommend the smallest safe fix",
    scopeIncluded: true,
    buildRequired: false,
  },
  evidence: { sufficient: true, refs: ["audit://finding/001"], confidence: 0.9 },
  blockers: [],
  riskClass: "R0",
  dependenciesSatisfied: true,
  approvalValid: false,
  stopRequested: false,
};

test("proceeds without invoking CRAFT when no verified blocker exists", () => {
  const result = decideGuidance(base);
  assert.equal(result.decision, "PROCEED");
  assert.equal(result.craftRequired, false);
  assert.equal(result.buildRequired, false);
  assert.equal(result.executionStarted, false);
});

test("invokes CRAFT only for verified blockers", () => {
  const result = decideGuidance({
    ...base,
    blockers: [{ id: "B-1", summary: "Required adapter is missing", verified: true }],
  });
  assert.equal(result.decision, "INVOKE_CRAFT");
  assert.equal(result.craftRequired, true);
  assert.equal(result.buildRequired, false);
});

test("does not invoke CRAFT for unverified blockers", () => {
  const result = decideGuidance({
    ...base,
    blockers: [{ id: "B-1", summary: "Possible adapter issue", verified: false }],
  });
  assert.equal(result.decision, "PROCEED");
  assert.equal(result.craftRequired, false);
});

test("gathers evidence before acting when evidence is insufficient", () => {
  const result = decideGuidance({ ...base, evidence: { sufficient: false, refs: [], confidence: 0.4 } });
  assert.equal(result.decision, "GATHER_EVIDENCE");
});

test("denies work outside the guidance scope", () => {
  const result = decideGuidance({ ...base, guidance: { ...base.guidance, scopeIncluded: false } });
  assert.equal(result.decision, "DENY");
});

test("requires approval for R2/R3 actions without valid approval", () => {
  const result = decideGuidance({ ...base, riskClass: "R2" });
  assert.equal(result.decision, "REQUIRE_APPROVAL");
  assert.equal(result.approvalRequired, true);
});

test("defers when dependencies are not satisfied", () => {
  const result = decideGuidance({ ...base, dependenciesSatisfied: false });
  assert.equal(result.decision, "DEFER");
});

test("stop request takes precedence over other decisions", () => {
  const result = decideGuidance({ ...base, stopRequested: true, blockers: [{ id: "B-1", summary: "Blocker", verified: true }] });
  assert.equal(result.decision, "STOP");
  assert.equal(result.craftRequired, false);
});

test("does not build unless guidance explicitly requires it", () => {
  const result = decideGuidance({ ...base, guidance: { ...base.guidance, buildRequired: true } });
  assert.equal(result.decision, "PROCEED");
  assert.equal(result.buildRequired, true);
});

test("rejects malformed confidence values", () => {
  assert.throws(() => decideGuidance({ ...base, evidence: { ...base.evidence, confidence: 2 } }), /confidence/);
});
