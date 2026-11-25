import test from "node:test";
import assert from "node:assert/strict";
import {
  COSMAXX_DOMAIN_IDS,
  COSMAXX_SEVEN_DOMAIN_REGISTRY,
  createUnassessedDomainSnapshot,
  getCosmaxxDomain,
} from "../lib/cosmaxx/seven-domain-registry.ts";

test("registry contains the seven canonical domains exactly once", () => {
  assert.equal(COSMAXX_SEVEN_DOMAIN_REGISTRY.length, 7);
  assert.deepEqual(COSMAXX_SEVEN_DOMAIN_REGISTRY.map((domain) => domain.id), [...COSMAXX_DOMAIN_IDS]);
  assert.equal(new Set(COSMAXX_SEVEN_DOMAIN_REGISTRY.map((domain) => domain.id)).size, 7);
});

test("new snapshots do not invent scores or assessment evidence", () => {
  const snapshot = createUnassessedDomainSnapshot();
  assert.equal(snapshot.length, 7);
  for (const domain of snapshot) {
    assert.equal(domain.status, "NOT_ASSESSED");
    assert.equal(domain.score, null);
    assert.deepEqual(domain.evidenceRefs, []);
    assert.equal(domain.assessedAt, null);
  }
});

test("every domain declares evaluation areas and evidence requirements", () => {
  for (const domain of COSMAXX_SEVEN_DOMAIN_REGISTRY) {
    assert.ok(domain.evaluationAreas.length > 0, domain.id);
    assert.ok(domain.requiredEvidence.length > 0, domain.id);
  }
});

test("domain lookup returns the canonical definition", () => {
  assert.equal(getCosmaxxDomain("GOVERN").id, "GOVERN");
  assert.throws(() => getCosmaxxDomain("UNKNOWN"), /Unknown COSMAXX domain/);
});
