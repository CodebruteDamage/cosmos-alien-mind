import test from "node:test";
import assert from "node:assert/strict";
import { createOpenAIProvider } from "../openai.mjs";

test("OpenAI provider uses Responses API, disables storage, and extracts output text", async () => {
  let request;
  const provider = createOpenAIProvider({
    apiKey: "test-key",
    model: "test-model",
    fetchImpl: async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) };
      return new Response(JSON.stringify({
        id: "resp_test",
        model: "test-model",
        output: [{ type: "message", content: [{ type: "output_text", text: "Hello from GPT" }] }]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
  });
  const result = await provider("hello");
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.options.headers.authorization, "Bearer test-key");
  assert.equal(request.body.store, false);
  assert.equal(request.body.input, "hello");
  assert.equal(result.text, "Hello from GPT");
  assert.equal(result.responseId, "resp_test");
});

test("OpenAI provider does not expose provider response bodies on errors", async () => {
  const provider = createOpenAIProvider({
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ error: { message: "private detail" } }), { status: 500 })
  });
  await assert.rejects(() => provider("hello"), (error) => {
    assert.equal(error.code, "PROVIDER_REQUEST_FAILED");
    assert.doesNotMatch(error.message, /private detail/);
    return true;
  });
});
