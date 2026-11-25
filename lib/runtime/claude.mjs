const DEFAULT_MODEL = "claude-sonnet-4-5";

export function createClaudeProvider({
  apiKey = process.env.ANTHROPIC_API_KEY,
  model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
  fetchImpl = fetch,
  timeoutMs = 30000
} = {}) {
  if (!apiKey) {
    const error = new Error("ANTHROPIC_API_KEY is not configured.");
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  return async function generate(prompt, context = {}) {
    const response = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        system: "You are Alien Mind, an independent critical reasoning provider for COSMOS. Analyze independently. Do not claim to execute actions, grant permissions, or authorize tools.",
        messages: [{ role: "user", content: prompt }]
      }),
      signal: context.signal || AbortSignal.timeout(timeoutMs)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(`Claude provider request failed with HTTP ${response.status}.`);
      error.code = "PROVIDER_REQUEST_FAILED";
      throw error;
    }

    const text = Array.isArray(payload.content)
      ? payload.content
          .filter((part) => part?.type === "text" && typeof part.text === "string")
          .map((part) => part.text)
          .join("\n")
      : "";

    if (!text.trim()) {
      const error = new Error("Claude provider returned no text output.");
      error.code = "EMPTY_PROVIDER_OUTPUT";
      throw error;
    }
    return { text, model: payload.model || model, responseId: payload.id || null };
  };
}
