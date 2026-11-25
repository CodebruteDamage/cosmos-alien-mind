const MAX_PROMPT_LENGTH = 20000;
const MAX_OUTPUT_LENGTH = 12000;
const MAX_DECISION_LENGTH = 256;
const DEFAULT_TIMEOUT_MS = 30000;

function validateProviderResult(result, label) {
  if (!result || typeof result !== "object") {
    throw new Error(`${label} provider returned an invalid result.`);
  }
  if (typeof result.text !== "string" || !result.text.trim()) {
    throw new Error(`${label} provider returned empty text.`);
  }
  if (result.text.length > MAX_OUTPUT_LENGTH) {
    throw new Error(`${label} provider output exceeded the size limit.`);
  }
  if (typeof result.decision !== "string" || !result.decision.trim()) {
    return {
      text: result.text,
      decision: null,
      model: typeof result.model === "string" ? result.model : null,
      reviewReason: `${label} did not provide a comparable decision.`
    };
  }
  if (result.decision.length > MAX_DECISION_LENGTH) {
    throw new Error(`${label} decision exceeded the size limit.`);
  }
  return {
    text: result.text,
    decision: result.decision.trim(),
    model: typeof result.model === "string" ? result.model : null
  };
}

/**
 * Runs COSMOS Core and Alien Mind independently against the same prompt.
 *
 * Providers must return { text, decision, model? }. The decision is a concise,
 * comparable conclusion, not an execution instruction or permission grant.
 * This coordinator never executes tools or authorizes side effects.
 */
export async function runDualCoreTurn({
  prompt,
  coreProvider,
  alienProvider,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  now = () => new Date()
}) {
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > MAX_PROMPT_LENGTH) {
    const error = new Error("Prompt must contain between 1 and 20,000 characters.");
    error.code = "INVALID_PROMPT";
    throw error;
  }
  if (typeof coreProvider !== "function" || typeof alienProvider !== "function") {
    const error = new Error("Both COSMOS Core and Alien Mind providers are required.");
    error.code = "DUAL_CORE_NOT_CONFIGURED";
    throw error;
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) {
    const error = new Error("timeoutMs must be between 1 and 120000.");
    error.code = "INVALID_TIMEOUT";
    throw error;
  }

  const startedAt = now().toISOString();
  const controller = new AbortController();
  let timeoutHandle;

  try {
    const timeout = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        controller.abort();
        const error = new Error("Dual-core analysis timed out.");
        error.code = "DUAL_CORE_TIMEOUT";
        reject(error);
      }, timeoutMs);
    });

    const runProviders = Promise.allSettled([
      coreProvider(prompt, { signal: controller.signal, role: "cosmos-core" }),
      alienProvider(prompt, { signal: controller.signal, role: "alien-mind" })
    ]);

    const settled = await Promise.race([runProviders, timeout]);
    const coreResult = settled[0].status === "fulfilled"
      ? validateProviderResult(settled[0].value, "COSMOS Core")
      : { text: null, decision: null, error: "COSMOS Core provider unavailable." };
    const alienResult = settled[1].status === "fulfilled"
      ? validateProviderResult(settled[1].value, "Alien Mind")
      : { text: null, decision: null, error: "Alien Mind provider unavailable." };

    let status = "needs_review";
    let reason = "Both independent conclusions must be present and comparable.";
    if (coreResult.decision && alienResult.decision) {
      const coreDecision = coreResult.decision.toLocaleLowerCase("en-US");
      const alienDecision = alienResult.decision.toLocaleLowerCase("en-US");
      if (coreDecision === alienDecision) {
        status = "aligned";
        reason = "Both providers returned the same normalized decision.";
      } else {
        reason = "COSMOS Core and Alien Mind returned different decisions.";
      }
    }

    return {
      ok: status === "aligned",
      status,
      reason,
      startedAt,
      completedAt: now().toISOString(),
      core: coreResult,
      alien: alienResult,
      governance: {
        executionPerformed: false,
        permissionsGranted: false,
        humanReviewRequired: status !== "aligned",
        alignmentIsNotAuthorization: true
      }
    };
  } catch (error) {
    if (error && error.code === "DUAL_CORE_TIMEOUT") {
      return {
        ok: false,
        status: "needs_review",
        reason: "Dual-core analysis timed out; no conclusion was authorized.",
        startedAt,
        completedAt: now().toISOString(),
        core: null,
        alien: null,
        governance: {
          executionPerformed: false,
          permissionsGranted: false,
          humanReviewRequired: true,
          alignmentIsNotAuthorization: true
        }
      };
    }
    throw error;
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}
