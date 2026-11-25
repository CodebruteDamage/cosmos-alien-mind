export function createDecisionProvider(provider, role) {
  if (typeof provider !== "function") {
    const error = new Error("A model provider is required.");
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }
  if (role !== "cosmos-core" && role !== "alien-mind") {
    throw new Error("Unsupported dual-core provider role.");
  }

  return async function generateDecision(prompt, context = {}) {
    const instruction = [
      "Analyze the request independently.",
      "Return ONLY a valid JSON object with exactly these string fields:",
      '{"text":"your concise analysis","decision":"a short, explicit recommended disposition"}',
      "The decision must be concise and comparable, such as proceed, reject, or needs_review.",
      "Do not claim that agreement grants permission or that any action was executed.",
      "Do not include markdown fences or additional text."
    ].join("\n");
    const result = await provider(`${instruction}\n\nRequest:\n${prompt}`, context);
    let parsed;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      const error = new Error(`${role} did not return the required JSON decision format.`);
      error.code = "INVALID_DECISION_FORMAT";
      throw error;
    }
    if (!parsed || typeof parsed.text !== "string" || !parsed.text.trim()
      || typeof parsed.decision !== "string" || !parsed.decision.trim()) {
      const error = new Error(`${role} returned an incomplete decision.`);
      error.code = "INVALID_DECISION_FORMAT";
      throw error;
    }
    return {
      text: parsed.text,
      decision: parsed.decision,
      model: result.model || null
    };
  };
}
