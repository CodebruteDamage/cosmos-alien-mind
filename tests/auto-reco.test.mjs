import test from "node:test";
import assert from "node:assert/strict";
import { generateAutoRecommendation } from "../lib/auto-reco/engine.mjs";

const objective = "Integrate Claude REA into COSMOS with governed automatic build recommendations";

test("composes Guidance, CRAFT, Evidence requirements and lifecycle stages", () => {
  const result = generateAutoRecommendation({
    objective,
    repository: "CodebruteDamage/cosmos-alien-mind"
  });

  assert.equal(result.schema, "cosmos.auto-reco.v1");
  assert.equal(result.recommendationOnly, true);
  assert.equal(result.executionAuthorized, false);
  assert.equal(result.guidance.engine.name, "COSMOS BUILD GUIDANCE ENGINE");
  assert.equal(result.craft.engine.name, "COSMOS CRAFT");
  assert.equal(result.evidence.status, "EVIDENCE_REQUIRED");
  assert.deepEqual(
    result.lifecycle.stages.map(stage => stage.id),
    ["INSPECT", "EVIDENCE", "GUIDANCE", "CRAFT", "POLICY", "PROVISION", "IMPLEMENT", "VALIDATE", "CERTIFY", "RELEASE"]
  );
  assert.equal(result.lifecycle.executionGate.defaultDecision, "DENY");
  assert.equal(result.lifecycle.releaseEligible, false);
});

test("derives an unverified repository-baseline blocker", () => {
  const result = generateAutoRecommendation({ objective });
  const baseline = result.craft.blockers.find(item => item.id === "repository-baseline");
  assert.ok(baseline);
  assert.equal(baseline.evidenceStatus, "UNVERIFIED");
  assert.equal(baseline.needsEvidenceReview, true);
});

test("does not authorize production work even when production is selected", () => {
  const result = generateAutoRecommendation({
    objective: "Deploy the COSMOS Claude REA integration to production",
    profile: "PRODUCTION"
  });
  assert.equal(result.lifecycle.requiresHumanApproval, true);
  assert.equal(result.lifecycle.releaseEligible, false);
  assert.equal(result.executionAuthorized, false);
});

test("rejects objectives outside the supported length", () => {
  assert.throws(
    () => generateAutoRecommendation({ objective: "short" }),
    /between 12 and 4000/
  );
});

test("keeps Claude API connectivity explicitly unverified", () => {
  const result = generateAutoRecommendation({ objective });
  assert.equal(result.providerPlan.selectedProvider, "claude");
  assert.equal(result.providerPlan.liveApiTestPerformed, false);
});
