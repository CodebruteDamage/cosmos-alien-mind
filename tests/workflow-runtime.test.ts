import test from "node:test";
import assert from "node:assert/strict";
import { executeWorkflow, type CapabilityHandler, type WorkflowDefinition } from "../lib/workflow-runtime.ts";

function definition(overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
  return {
    id: "incident-triage",
    version: 1,
    limits: { maxSteps: 10, maxDurationMs: 5000, maxRetries: 1 },
    steps: [{
      id: "collect-health",
      capability: "service.health.read",
      kind: "read",
      risk: "low",
      input: { service: "api" },
    }],
    ...overrides,
  };
}

const allow = () => ({ allowed: true, reason: "Allowed by test policy." });

test("executes a registered capability and requires verified postconditions", async () => {
  const handler: CapabilityHandler = async (_input, context) => ({
    output: { healthy: true, idempotencyKey: context.idempotencyKey },
    verified: true,
    evidence: ["health-check:200"],
  });
  const result = await executeWorkflow(definition(), {
    handlers: { "service.health.read": handler },
    authorize: allow,
    now: () => Date.parse("2026-10-23T00:00:00.000Z"),
  });
  assert.equal(result.status, "completed");
  assert.equal(result.outputs["collect-health"] && (result.outputs["collect-health"] as { healthy: boolean }).healthy, true);
  assert.ok(result.events.some((event) => event.type === "step.verified"));
  assert.ok(result.events.some((event) => event.type === "workflow.completed"));
});

test("blocks a capability denied by policy without invoking it", async () => {
  let invoked = false;
  const result = await executeWorkflow(definition(), {
    handlers: { "service.health.read": async () => { invoked = true; return { output: {}, verified: true }; } },
    authorize: () => ({ allowed: false, reason: "Capability is outside the workflow scope." }),
  });
  assert.equal(result.status, "blocked");
  assert.equal(invoked, false);
});

test("blocks destructive and high-impact actions even when a policy callback allows them", async () => {
  let invoked = false;
  const result = await executeWorkflow(definition({
    steps: [{ id: "delete-record", capability: "record.delete", kind: "delete", risk: "critical", input: { id: "123" } }],
  }), {
    handlers: { "record.delete": async () => { invoked = true; return { output: {}, verified: true }; } },
    authorize: allow,
  });
  assert.equal(result.status, "blocked");
  assert.equal(invoked, false);
});

test("fails closed when postcondition verification is missing", async () => {
  const result = await executeWorkflow(definition(), {
    handlers: { "service.health.read": async () => ({ output: { healthy: true }, verified: false }) },
    authorize: allow,
  });
  assert.equal(result.status, "failed");
  assert.match(result.error ?? "", /verification/i);
});

test("retries only when explicitly marked retry-safe", async () => {
  let attempts = 0;
  const handler: CapabilityHandler = async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("transient");
    return { output: { ok: true }, verified: true };
  };
  const noRetry = await executeWorkflow(definition(), {
    handlers: { "service.health.read": handler },
    authorize: allow,
  });
  assert.equal(noRetry.status, "failed");
  assert.equal(attempts, 1);

  attempts = 0;
  const withRetry = await executeWorkflow(definition({
    steps: [{ ...definition().steps[0], retrySafe: true, retries: 1 }],
  }), {
    handlers: { "service.health.read": handler },
    authorize: allow,
  });
  assert.equal(withRetry.status, "completed");
  assert.equal(attempts, 2);
});

test("rejects duplicate step IDs before executing any capability", async () => {
  let invoked = false;
  const base = definition().steps[0];
  const result = await executeWorkflow(definition({ steps: [base, { ...base }] }), {
    handlers: { "service.health.read": async () => { invoked = true; return { output: {}, verified: true }; } },
    authorize: allow,
  });
  assert.equal(result.status, "blocked");
  assert.equal(invoked, false);
});
