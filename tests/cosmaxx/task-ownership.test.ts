import assert from "node:assert/strict";
import test from "node:test";
import {
  assignTaskOwnership,
  type TaskOwnershipRequest,
} from "../../lib/orchestration/task-ownership";

function request(overrides: Partial<TaskOwnershipRequest> = {}): TaskOwnershipRequest {
  return {
    taskId: "task-001",
    description: "Harden the runtime adapter",
    category: "runtime_hardening",
    risk: "read_only",
    requiredCapabilities: ["node", "github"],
    executionProviders: [
      { id: "github-actions", capabilities: ["node", "github", "ci"] },
    ],
    acceptanceCriteria: ["All required checks pass"],
    ...overrides,
  };
}

test("assigns the specialist task owner and keeps ORCH/TPO roles distinct", () => {
  const assignment = assignTaskOwnership(request());

  assert.equal(assignment.status, "assigned");
  assert.equal(assignment.taskOwner, "COSMAXX");
  assert.equal(assignment.orchestrator, "ORCH");
  assert.equal(assignment.providerRouter, "TPO");
  assert.equal(assignment.executionProvider, "github-actions");
  assert.equal(assignment.blockerProvider, "CRAFT");
  assert.equal(assignment.validationProvider, "12_GAP_CYCLE");
  assert.equal(assignment.governanceProvider, "WARP_GATE");
  assert.equal(assignment.evidenceProvider, "CME_EVIDENCE_ENGINE");
  assert.equal(assignment.dispatchReady, true);
});

test("blocks when more than one execution provider is eligible", () => {
  const assignment = assignTaskOwnership(request({
    executionProviders: [
      { id: "github-actions", capabilities: ["node", "github"] },
      { id: "termux", capabilities: ["node", "github"] },
    ],
  }));

  assert.equal(assignment.status, "blocked");
  assert.equal(assignment.executionProvider, null);
  assert.match(assignment.blockers.join(" "), /ambiguous/i);
});

test("selects a preferred provider only when it meets all required capabilities", () => {
  const assignment = assignTaskOwnership(request({
    preferredExecutionProvider: "termux",
    executionProviders: [
      { id: "github-actions", capabilities: ["node", "github"] },
      { id: "termux", capabilities: ["node", "github", "local-shell"] },
    ],
  }));

  assert.equal(assignment.status, "assigned");
  assert.equal(assignment.executionProvider, "termux");
});

test("blocks a preferred provider that lacks a required capability", () => {
  const assignment = assignTaskOwnership(request({
    preferredExecutionProvider: "termux",
    executionProviders: [
      { id: "termux", capabilities: ["node"] },
    ],
  }));

  assert.equal(assignment.status, "blocked");
  assert.equal(assignment.executionProvider, null);
  assert.match(assignment.blockers.join(" "), /unavailable or lacks/i);
});

test("requires WARP GATE authorization for side effects and human approval for consequential work", () => {
  const sideEffect = assignTaskOwnership(request({ risk: "side_effect" }));
  const consequential = assignTaskOwnership(request({ risk: "consequential" }));

  assert.equal(sideEffect.requiresWarpGateAuthorization, true);
  assert.equal(sideEffect.requiresHumanApproval, false);
  assert.equal(sideEffect.dispatchReady, false);
  assert.equal(consequential.requiresWarpGateAuthorization, true);
  assert.equal(consequential.requiresHumanApproval, true);
  assert.equal(consequential.dispatchReady, false);
});

test("blocks tasks without acceptance criteria", () => {
  const assignment = assignTaskOwnership(request({ acceptanceCriteria: [] }));

  assert.equal(assignment.status, "blocked");
  assert.equal(assignment.dispatchReady, false);
  assert.match(assignment.blockers.join(" "), /acceptance criterion/i);
});
