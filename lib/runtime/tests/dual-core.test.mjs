import test from "node:test";
import assert from "node:assert/strict";
import { runDualCoreTurn } from "../dual-core.mjs";

const provider = (text, decision) => async () => ({ text, decision });

test("dual core reports aligned only when both independent decisions match", async () => {
  const result = await runDualCoreTurn({
    prompt: "Assess the proposed change.",
    coreProvider: provider("Core analysis", "approve concept"),
    alienProvider: provider("Independent analysis", "APPROVE CONCEPT")
  });
  assert.equal(result.status, "aligned");
  assert.equal(result.ok, true);
  assert.equal(result.governance.executionPerformed, false);
  assert.equal(result.governance.permissionsGranted, false);
  assert.equal(result.governance.alignmentIsNotAuthorization, true);
});

test("dual core sends conflicting decisions to human review", async () => {
  const result = await runDualCoreTurn({
    prompt: "Assess the proposed change.",
    coreProvider: provider("Core analysis", "proceed"),
    alienProvider: provider("Alien analysis", "reject")
  });
  assert.equal(result.status, "needs_review");
  assert.equal(result.ok, false);
  assert.match(result.reason, /different decisions/);
  assert.equal(result.governance.humanReviewRequired, true);
});

test("missing comparable decision fails closed", async () => {
  const result = await runDualCoreTurn({
    prompt: "Assess the proposed change.",
    coreProvider: provider("Core analysis", "proceed"),
    alienProvider: async () => ({ text: "No structured decision" })
  });
  assert.equal(result.status, "needs_review");
  assert.equal(result.ok, false);
});

test("one unavailable provider fails closed rather than silently using the other", async () => {
  const result = await runDualCoreTurn({
    prompt: "Assess the proposed change.",
    coreProvider: provider("Core analysis", "proceed"),
    alienProvider: async () => { throw new Error("provider offline"); }
  });
  assert.equal(result.status, "needs_review");
  assert.equal(result.alien.error, "Alien Mind provider unavailable.");
  assert.equal(result.governance.executionPerformed, false);
});

test("timeout aborts both providers and requires review", async () => {
  let receivedSignal;
  const slowProvider = async (_prompt, context) => {
    receivedSignal = context.signal;
    return new Promise(() => {});
  };
  const result = await runDualCoreTurn({
    prompt: "Assess the proposed change.",
    coreProvider: slowProvider,
    alienProvider: slowProvider,
    timeoutMs: 10
  });
  assert.equal(result.status, "needs_review");
  assert.equal(result.governance.humanReviewRequired, true);
  assert.equal(receivedSignal.aborted, true);
});

test("dual core rejects missing providers and invalid prompts", async () => {
  await assert.rejects(
    () => runDualCoreTurn({ prompt: "hello", coreProvider: provider("x", "x") }),
    { code: "DUAL_CORE_NOT_CONFIGURED" }
  );
  await assert.rejects(
    () => runDualCoreTurn({
      prompt: " ",
      coreProvider: provider("x", "x"),
      alienProvider: provider("y", "y")
    }),
    { code: "INVALID_PROMPT" }
  );
});

test("malformed provider result fails closed and requires review", async () => {
  const result = await runDualCoreTurn({
    prompt: "Assess the proposed change.",
    coreProvider: provider("Core analysis", "proceed"),
    alienProvider: async () => ({ text: "", decision: "proceed" })
  });
  assert.equal(result.status, "needs_review");
  assert.equal(result.ok, false);
  assert.equal(result.alien.error, "Alien Mind returned an invalid decision.");
  assert.equal(result.governance.humanReviewRequired, true);
});
