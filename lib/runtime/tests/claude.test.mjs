import test from "node:test";
import assert from "node:assert/strict";
import { createClaudeProvider } from "../claude.mjs";

test("Claude provider uses Messages API and extracts text content", async () => {
  let request;
  const provider = createClaudeProvider({
    apiKey: "test-anthropic-key",
    model: "test-claude-model",
    fetchImpl: async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) };
      return new Response(JSON.stringify({
        id: "msg_test",
        model: "test-claude-model",
        content: [{ type: "text", text: '{"text":"Independent review","decision":"proceed"}' }]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
  });
  const result = await provider("review this");
  assert.equal(request.url, "https://api.anthropic.com/v1/messages");
  assert.equal(request.options.headers["x-api-key"], "test-anthropic-key");
  assert.equal(request.options.headers["anthropic-version"], "2023-06-01");
  assert.equal(request.body.model, "test-claude-model");
  assert.equal(result.text, '{"text":"Independent review","decision":"proceed"}');
  assert.equal(result.responseId, "msg_test");
});

test("Claude provider does not expose provider response bodies on errors", async () => {
  const provider = createClaudeProvider({
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ error: { message: "private detail" } }), { status: 500 })
  });
  await assert.rejects(() => provider("hello"), (error) => {
    assert.equal(error.code, "PROVIDER_REQUEST_FAILED");
    assert.doesNotMatch(error.message, /private detail/);
    return true;
  });
});
