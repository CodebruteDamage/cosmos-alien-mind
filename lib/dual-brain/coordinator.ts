import {
  BrainRequestSchema,
  BrainResponseSchema,
  type BrainAdapter,
  type BrainDisagreement,
  type BrainInvocation,
  type BrainRequest,
  type BrainRole,
  type DualBrainResult,
} from "./contracts";

export type DualBrainAdapters = {
  cosmosCore: BrainAdapter;
  alienMind: BrainAdapter;
};

export type DualBrainCoordinatorOptions = {
  timeoutMs?: number;
};

/**
 * Invokes the two analytical roles independently and correlates their results.
 * This coordinator has no tool executor, credential access, or authorization
 * authority. Any proposed action must be re-authorized by WARP GATE elsewhere.
 */
export async function coordinateDualBrain(
  input: Omit<BrainRequest, "role">,
  adapters: DualBrainAdapters,
  options: DualBrainCoordinatorOptions = {},
): Promise<DualBrainResult> {
  const timeoutMs = options.timeoutMs ?? input.deadlineMs;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60_000) {
    throw new Error("Dual-brain timeout must be between 100 and 60000 milliseconds.");
  }

  const base = BrainRequestSchema.omit({ role: true }).parse(input);

  const invoke = async (role: BrainRole, adapter: BrainAdapter): Promise<BrainInvocation> => {
    const request = BrainRequestSchema.parse({ ...base, role });
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const timedOut = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("DUAL_BRAIN_TIMEOUT"));
        }, timeoutMs);
      });

      const raw = await Promise.race([adapter(request, controller.signal), timedOut]);
      const parsed = BrainResponseSchema.safeParse(raw);
      if (!parsed.success) {
        return { role, status: "error", errorCode: "INVALID_RESPONSE" };
      }
      if (parsed.data.requestId !== request.requestId || parsed.data.role !== role) {
        return { role, status: "error", errorCode: "CORRELATION_MISMATCH" };
      }
      return { role, status: parsed.data.status, response: parsed.data };
    } catch (error) {
      if (error instanceof Error && error.message === "DUAL_BRAIN_TIMEOUT") {
        return { role, status: "timeout", errorCode: "TIMEOUT" };
      }
      return { role, status: "error", errorCode: "ADAPTER_ERROR" };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  };

  const [core, alien] = await Promise.all([
    invoke("cosmos_core", adapters.cosmosCore),
    invoke("alien_mind", adapters.alienMind),
  ]);

  const invocations = [core, alien];
  const availableRoles = invocations
    .filter((item) => item.status === "ok" && item.response)
    .map((item) => item.role);

  const disagreements: BrainDisagreement[] = [];
  if (core.status === "ok" && alien.status === "ok" && core.response && alien.response) {
    const alienClaims = new Map(alien.response.claims.map((claim) => [claim.claimId, claim]));
    for (const coreClaim of core.response.claims) {
      const alienClaim = alienClaims.get(coreClaim.claimId);
      if (
        alienClaim &&
        ((coreClaim.stance === "supports" && alienClaim.stance === "opposes") ||
          (coreClaim.stance === "opposes" && alienClaim.stance === "supports"))
      ) {
        disagreements.push({
          claimId: coreClaim.claimId,
          cosmosCore: coreClaim,
          alienMind: alienClaim,
        });
      }
    }
  }

  let status: DualBrainResult["status"];
  if (availableRoles.length === 0) status = "unavailable";
  else if (availableRoles.length === 1) status = "degraded";
  else if (disagreements.length > 0) status = "needs_review";
  else status = "complete";

  return {
    requestId: base.requestId,
    status,
    invocations,
    disagreements,
    availableRoles,
    // Two agreeing model outputs are not proof. Preserve this explicit invariant.
    consensusClaim: false,
  };
}
