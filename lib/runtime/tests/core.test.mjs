import test from "node:test";
import assert from "node:assert/strict";
import { runAssistantTurn } from "../core.mjs";

test("runtime completes a provider-backed assistant response with lifecycle evidence", async () => {
  const result = await runAssistantTurn({
    prompt: "Explain the runtime.",
    provider: async () => ({ text: "Runtime response", model: "test-model", responseId: "resp_test" }),
    now: () => new Date("2026-11-25T00:00:00.000Z")
  });
  assert.equal(result.ok, true);
  assert.equal(result.task.type, "assistant.respond");
  assert.equal(result.answer, "Runtime response");
  assert.equal(result.evidence.toolExecution, false);
  assert.equal(result.evidence.persistence, false);
  assert.ok(result.evidence.lifecycle.some((event) => event.stage === "verification" && event.status === "completed"));
});

test("runtime rejects empty and oversized prompts before provider invocation", async () => {
  let called = false;
  const provider = async () => { called = true; return { text: "unexpected" }; };
  await assert.rejects(() => runAssistantTurn({ prompt: "  ", provider }), { code: "INVALID_PROMPT" });
  await assert.rejects(() => runAssistantTurn({ prompt: "x".repeat(20001), provider }), { code: "INVALID_PROMPT" });
  assert.equal(called, false);
});

test("runtime rejects empty provider output", async () => {
  await assert.rejects(
    () => runAssistantTurn({ prompt: "hello", provider: async () => ({ text: " " }) }),
    { code: "EMPTY_PROVIDER_OUTPUT" }
  );
});
