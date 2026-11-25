import test from "node:test";
import assert from "node:assert/strict";
import { createDecisionProvider } from "../decision-provider.mjs";

test("decision provider extracts comparable decision JSON", async () => {
  let receivedPrompt = "";
  const wrapped = createDecisionProvider(async (prompt) => {
    receivedPrompt = prompt;
    return {
      text: '{"text":"Reviewed the request","decision":"proceed"}',
      model: "mock-model"
    };
  }, "alien-mind");
  const result = await wrapped("Assess this request.");
  assert.match(receivedPrompt, /Return ONLY a valid JSON object/);
  assert.equal(result.text, "Reviewed the request");
  assert.equal(result.decision, "proceed");
  assert.equal(result.model, "mock-model");
});

test("decision provider rejects non-JSON output", async () => {
  const wrapped = createDecisionProvider(async () => ({ text: "plain text" }), "cosmos-core");
  await assert.rejects(() => wrapped("hello"), { code: "INVALID_DECISION_FORMAT" });
});

test("decision provider rejects incomplete structured output", async () => {
  const wrapped = createDecisionProvider(async () => ({ text: '{"text":"analysis"}' }), "cosmos-core");
  await assert.rejects(() => wrapped("hello"), { code: "INVALID_DECISION_FORMAT" });
});
