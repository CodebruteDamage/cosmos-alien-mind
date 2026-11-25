import test from "node:test";
import assert from "node:assert/strict";
import { executeWorkflow, type WorkflowDefinition } from "../lib/workflow-runtime.ts";
import { createWarpGateAuthorizer, type WarpGatePort } from "../lib/warp-gate-adapter.ts";

const workflow: WorkflowDefinition = {
  id: "apex-governed-test",
  version: 1,
  limits: { maxSteps: 2, maxDurationMs: 5000, maxRetries: 0 },
  steps: [{ id: "read-health", capability: "service.health.read", kind: "read", risk: "low", input: {} }],
};

function gate(overrides: Partial<WarpGatePort> = {}): WarpGatePort {
  return {
    authorize: async () => ({ decision: "ALLOW", executionGrant: "signed-grant-test" }),
    verifyAndConsume: async () => ({ valid: true, reason: "verified" }),
    ...overrides,
  };
}

test("verifies and consumes the WARP GATE grant before invoking a capability", async () => {
  const order: string[] = [];
  const authorizer = createWarpGateAuthorizer(gate({
    authorize: async ({ binding }) => {
      order.push("authorize");
      assert.equal(binding.capability, "service.health.read");
      return { decision: "ALLOW", executionGrant: "signed-grant-test" };
    },
    verifyAndConsume: async ({ executionGrant, expected }) => {
      order.push("verify-consume");
      assert.equal(executionGrant, "signed-grant-test");
      assert.equal(expected.workflowId, workflow.id);
      return { valid: true, reason: "ok" };
    },
  }));
  const result = await executeWorkflow(workflow, {
    authorize: authorizer,
    handlers: { "service.health.read": async () => {
      order.push("handler");
      return { output: { healthy: true }, verified: true };
    } },
  });
  assert.equal(result.status, "completed");
  assert.deepEqual(order, ["authorize", "verify-consume", "handler"]);
});

test("denies execution when WARP GATE returns DENY", async () => {
  let invoked = false;
  const result = await executeWorkflow(workflow, {
    authorize: createWarpGateAuthorizer(gate({
      authorize: async () => ({ decision: "DENY", reason: "policy denied" }),
    })),
    handlers: { "service.health.read": async () => { invoked = true; return { output: {}, verified: true }; } },
  });
  assert.equal(result.status, "blocked");
  assert.equal(invoked, false);
});

test("does not treat a bare ALLOW without a grant as authorization", async () => {
  let invoked = false;
  const result = await executeWorkflow(workflow, {
    authorize: createWarpGateAuthorizer(gate({
      authorize: async () => ({ decision: "ALLOW", executionGrant: "" }),
    })),
    handlers: { "service.health.read": async () => { invoked = true; return { output: {}, verified: true }; } },
  });
  assert.equal(result.status, "blocked");
  assert.equal(invoked, false);
});

test("fails closed when executor-side grant verification rejects the binding", async () => {
  let invoked = false;
  const result = await executeWorkflow(workflow, {
    authorize: createWarpGateAuthorizer(gate({
      verifyAndConsume: async () => ({ valid: false, reason: "tenant or target mismatch" }),
    })),
    handlers: { "service.health.read": async () => { invoked = true; return { output: {}, verified: true }; } },
  });
  assert.equal(result.status, "blocked");
  assert.equal(invoked, false);
  assert.match(result.error ?? "", /mismatch/i);
});

test("fails closed when WARP GATE dependencies throw", async () => {
  let invoked = false;
  const result = await executeWorkflow(workflow, {
    authorize: createWarpGateAuthorizer(gate({
      verifyAndConsume: async () => { throw new Error("verifier unavailable"); },
    })),
    handlers: { "service.health.read": async () => { invoked = true; return { output: {}, verified: true }; } },
  });
  assert.equal(result.status, "blocked");
  assert.equal(invoked, false);
});
