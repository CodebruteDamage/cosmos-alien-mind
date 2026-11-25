import test from "node:test";
import assert from "node:assert/strict";
import { GET, POST } from "../app/api/guidance/decision/route.ts";

const base = {
  objective: "Validate the Guidance-Craft integration",
  objectiveSatisfied: false,
  guidance: {
    recommendation: "Assess only the supplied in-scope blocker",
    scopeIncluded: true,
    buildRequired: false
  },
  evidence: {
    sufficient: true,
    refs: ["audit://m01/baseline"],
    confidence: 0.9
  },
  blockers: [],
  riskClass: "R0",
  dependenciesSatisfied: true,
  approvalValid: false,
  stopRequested: false
};

const assessment = {
  complexity: 2,
  risk: 3,
  urgency: 3,
  dependency: 2,
  confidence: 4,
  evidenceRefs: ["audit://m01/blocker/B-1"],
  source: "m01-test-fixture"
};

function request(payload) {
  return new Request("http://localhost/api/guidance/decision", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("GET exposes the decision-only, untrusted-input boundary", async () => {
  const response = await GET();
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.executesActions, false);
  assert.equal(body.authorizationGranted, false);
  assert.equal(body.trustBoundary, "caller_asserted_untrusted");
});

test("POST proceeds without CRAFT when no verified blocker is supplied", async () => {
  const response = await POST(request(base));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.decision, "PROCEED");
  assert.equal(body.craft.status, "SKIPPED");
  assert.equal(body.craft.invoked, false);
  assert.equal(body.authorizationGranted, false);
  assert.equal(body.executionStarted, false);
});

test("POST invokes recommendation-only CRAFT for a selected verified blocker", async () => {
  const response = await POST(request({
    ...base,
    blockers: [{
      id: "B-1",
      summary: "Integration adapter needs assessment",
      verified: true,
      assessment
    }]
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.decision, "INVOKE_CRAFT");
  assert.equal(body.craft.invoked, true);
  assert.equal(body.craft.status, "RECOMMENDATION_ONLY");
  assert.equal(body.craft.assessments.length, 1);
  assert.equal(body.craft.authorizationGranted, false);
  assert.equal(body.craft.executionStarted, false);
  assert.equal(body.trustBoundary, "caller_asserted_untrusted");
});

test("POST returns GATHER_EVIDENCE when CRAFT confidence is below threshold", async () => {
  const response = await POST(request({
    ...base,
    blockers: [{
      id: "B-1",
      summary: "Assessment needs stronger evidence",
      verified: true,
      assessment: { ...assessment, confidence: 1 }
    }]
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.decision, "INVOKE_CRAFT");
  assert.equal(body.craft.invoked, true);
  assert.equal(body.craft.status, "GATHER_EVIDENCE");
  assert.deepEqual(body.craft.missingEvidenceBlockerIds, ["B-1"]);
  assert.equal(body.craft.assessments[0].evidenceRequired, true);
  assert.equal(body.craft.executionStarted, false);
});

test("POST rejects malformed CRAFT assessment dimensions", async () => {
  const response = await POST(request({
    ...base,
    blockers: [{
      id: "B-1",
      summary: "Malformed assessment",
      verified: true,
      assessment: { ...assessment, risk: 9 }
    }]
  }));
  assert.equal(response.status, 400);
});

test("POST requires approval for R2 when no blocker takes precedence", async () => {
  const response = await POST(request({ ...base, riskClass: "R2" }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.decision, "REQUIRE_APPROVAL");
  assert.equal(body.approvalRequired, true);
  assert.equal(body.craft.status, "SKIPPED");
  assert.equal(body.authorizationGranted, false);
});

test("POST preserves STOP and DENY precedence without invoking CRAFT", async (t) => {
  await t.test("STOP", async () => {
    const response = await POST(request({
      ...base,
      stopRequested: true,
      blockers: [{ id: "B-1", summary: "Caller-asserted blocker", verified: true, assessment }]
    }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.decision, "STOP");
    assert.equal(body.craft.status, "SKIPPED");
  });

  await t.test("DENY", async () => {
    const response = await POST(request({
      ...base,
      guidance: { ...base.guidance, policyDenied: true },
      blockers: [{ id: "B-1", summary: "Caller-asserted blocker", verified: true, assessment }]
    }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.decision, "DENY");
    assert.equal(body.craft.status, "SKIPPED");
  });
});

test("POST rejects invalid JSON", async () => {
  const req = new Request("http://localhost/api/guidance/decision", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  });
  const response = await POST(req);
  assert.equal(response.status, 400);
});

test("POST does not invoke CRAFT for a caller-asserted unverified blocker", async () => {
  const response = await POST(request({
    ...base,
    blockers: [{
      id: "B-1",
      summary: "Unverified possible integration issue",
      verified: false,
      assessment
    }]
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.decision, "PROCEED");
  assert.equal(body.craft.invoked, false);
  assert.equal(body.craft.status, "SKIPPED");
  assert.equal(body.authorizationGranted, false);
});
