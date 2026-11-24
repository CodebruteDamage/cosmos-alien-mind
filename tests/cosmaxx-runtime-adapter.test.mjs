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

test("runtime adapter is read-only and never starts execution", () => {
  const snapshot = getCosmaxxRuntimeSnapshot();
  assert.equal(snapshot.mode, "read_only_registry_adapter");
  assert.equal(snapshot.executionStarted, false);
  assert.equal(snapshot.adapter, "COSMAXX Runtime Adapter");
});
