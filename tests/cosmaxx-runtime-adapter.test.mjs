import test from "node:test";
import assert from "node:assert/strict";
import { getCosmaxxRuntimeSnapshot } from "../lib/cosmaxx/runtime-adapter.ts";

test("runtime adapter exposes the canonical seven-domain registry in order", () => {
  const snapshot = getCosmaxxRuntimeSnapshot();
  assert.equal(snapshot.domains.length, 7);
  assert.deepEqual(
    snapshot.domains.map(({ definition }) => definition.id),
    ["THINK", "KNOW", "ACT", "GOVERN", "ADAPT", "COMPANION", "EVOLVE"],
  );
});

test("runtime adapter joins each definition to its matching unassessed snapshot", () => {
  const snapshot = getCosmaxxRuntimeSnapshot();
  for (const { definition, assessment } of snapshot.domains) {
    assert.equal(assessment.domainId, definition.id);
    assert.equal(assessment.status, "NOT_ASSESSED");
    assert.equal(assessment.score, null);
    assert.deepEqual(assessment.evidenceRefs, []);
    assert.deepEqual(assessment.gaps, []);
    assert.equal(assessment.assessedAt, null);
  }
});

test("COSMAXX LT is the active lightweight read-only runtime profile", () => {
  const snapshot = getCosmaxxRuntimeSnapshot();
  assert.equal(snapshot.profile.id, "COSMAXX_LT");
  assert.equal(snapshot.profile.version, "1.0.0");
  assert.equal(snapshot.mode, "lightweight_read_only");
  assert.equal(snapshot.version, "0.2.0");
  assert.equal(snapshot.executionStarted, false);
});

test("COSMAXX LT exposes governed capabilities without enabling execution", () => {
  const { capabilities } = getCosmaxxRuntimeSnapshot().profile;
  assert.equal(capabilities.registryRead, true);
  assert.equal(capabilities.evidenceMetadataRead, true);
  assert.equal(capabilities.guidanceDecisionInput, true);
  assert.equal(capabilities.craftInvocation, "guidance_conditional");
  assert.equal(capabilities.taskforceDispatch, false);
  assert.equal(capabilities.sideEffectExecution, false);
  assert.equal(capabilities.permissionManagement, false);
});

test("runtime adapter preserves registry evidence requirements for every domain", () => {
  const snapshot = getCosmaxxRuntimeSnapshot();
  for (const { definition } of snapshot.domains) {
    assert.ok(definition.evaluationAreas.length > 0);
    assert.ok(definition.requiredEvidence.length > 0);
  }
});
