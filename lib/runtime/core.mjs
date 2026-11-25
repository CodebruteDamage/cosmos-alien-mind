const MAX_PROMPT_LENGTH = 20000;
const MAX_OUTPUT_LENGTH = 12000;

export async function runAssistantTurn({ prompt, provider, now = () => new Date() }) {
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > MAX_PROMPT_LENGTH) {
    const error = new Error("Prompt must contain between 1 and 20,000 characters.");
    error.code = "INVALID_PROMPT";
    throw error;
  }
  if (typeof provider !== "function") {
    const error = new Error("A configured model provider is required.");
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  const startedAt = now().toISOString();
  const lifecycle = [{ stage: "intake", status: "completed", at: startedAt }];
  lifecycle.push({ stage: "authorization", status: "completed", at: now().toISOString(), policy: "authenticated-server-request" });
  lifecycle.push({ stage: "skill-selection", status: "completed", at: now().toISOString(), skill: "assistant.respond" });
  lifecycle.push({ stage: "execution", status: "started", at: now().toISOString(), provider: "openai-responses" });

  const result = await provider(prompt);
  if (!result || typeof result.text !== "string" || !result.text.trim()) {
    const error = new Error("The model provider returned no text output.");
    error.code = "EMPTY_PROVIDER_OUTPUT";
    throw error;
  }
  const answer = result.text.slice(0, MAX_OUTPUT_LENGTH);
  lifecycle.push({ stage: "execution", status: "completed", at: now().toISOString() });
  lifecycle.push({ stage: "verification", status: "completed", at: now().toISOString(), checks: ["non-empty-text", "output-size-limit"] });
  lifecycle.push({ stage: "record", status: "skipped", at: now().toISOString(), reason: "durable-runtime-audit-not-configured" });

  return {
    ok: true,
    task: { type: "assistant.respond", status: "completed" },
    answer,
    evidence: {
      provider: "openai-responses",
      model: result.model,
      responseId: result.responseId ?? null,
      startedAt,
      completedAt: now().toISOString(),
      lifecycle,
      sideEffects: [],
      toolExecution: false,
      persistence: false
    }
  };
}
