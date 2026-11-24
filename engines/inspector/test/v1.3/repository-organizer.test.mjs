import test from "node:test";
import assert from "node:assert/strict";
import { buildRepositoryOrganizationPlan } from "../../src/v1.3/repository-organizer.mjs";

const snapshot = (overrides = {}) => ({
  contractVersion: "1.0",
  generatedAt: "2026-11-25T00:00:00.000Z",
  source: { kind: "github_inventory", authenticity: "UNVERIFIED" },
  repositories: [{
    name: "owner/repo",
    defaultBranch: "main",
    branches: [{ name: "main", protected: false }, { name: "feature/a", protected: false }],
    workflows: [{ name: "CI", status: "failure" }, { name: "Nightly", status: "cancelled" }]
  }],
  ...overrides
});

test("flags unprotected default and feature branches plus failed workflows", () => {
  const report = buildRepositoryOrganizationPlan(snapshot());
  assert.equal(report.ok, true);
  assert.equal(report.mode, "READ_ONLY");
  assert.equal(report.disposition, "REVIEW_REQUIRED");
  assert.equal(report.findings.filter(x => x.category === "DEFAULT_BRANCH_UNPROTECTED").length, 1);
  assert.equal(report.findings.filter(x => x.category === "FEATURE_BRANCH_UNPROTECTED").length, 1);
  assert.equal(report.findings.filter(x => x.category === "WORKFLOW_NOT_GREEN").length, 2);
});

test("sorts findings deterministically by severity and identity", () => {
  const report = buildRepositoryOrganizationPlan(snapshot());
  assert.deepEqual(report.findings.map(x => x.id), ["INS-ORG-001", "INS-ORG-002", "INS-ORG-003", "INS-ORG-004"]);
  assert.equal(report.findings[0].severity, "HIGH");
});

test("does not issue destructive actions", () => {
  const report = buildRepositoryOrganizationPlan(snapshot());
  assert.ok(report.findings.every(x => x.action === "RECOMMENDATION_ONLY" && x.requiresHumanApproval));
  assert.ok(report.constraints.some(x => x.includes("No branch is automatically deleted")));
});

test("rejects duplicate repository names", () => {
  const data = snapshot();
  data.repositories.push(structuredClone(data.repositories[0]));
  assert.equal(buildRepositoryOrganizationPlan(data).ok, false);
});

test("rejects missing default branch inventory", () => {
  const data = snapshot();
  data.repositories[0].branches = [{ name: "feature/a", protected: false }];
  assert.equal(buildRepositoryOrganizationPlan(data).code, "INS-ORG-001");
});

test("does not call cancelled workflows code failures", () => {
  const data = snapshot();
  data.repositories[0].workflows = [{ name: "CI", status: "cancelled" }];
  const report = buildRepositoryOrganizationPlan(data);
  const workflowFinding = report.findings.find(item => item.category === "WORKFLOW_NOT_GREEN");
  assert.equal(workflowFinding.severity, "MEDIUM");
  assert.match(workflowFinding.recommendation, /do not treat cancellation as a code failure/);
});

test("returns no findings for a protected clean inventory", () => {
  const data = snapshot();
  data.repositories[0].branches = [{ name: "main", protected: true }];
  data.repositories[0].workflows = [{ name: "CI", status: "success" }];
  const report = buildRepositoryOrganizationPlan(data);
  assert.equal(report.disposition, "NO_FINDINGS");
  assert.equal(report.findings.length, 0);
});
