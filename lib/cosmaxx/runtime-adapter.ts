import {
  COSMAXX_CONTRACT_VERSION,
  COSMOS_DOMAIN_IDS,
  type AuthorizationDecision,
  type CosmaxxAuthorization,
  type CosmaxxOptimizer,
  type OptimizationRecommendation,
  type OptimizationRequest,
  type OptimizationResult,
} from "./contracts";

export type CosmaxxRuntimeAdapterOptions = {
  optimizer: CosmaxxOptimizer;
  authorization: CosmaxxAuthorization;
  timeoutMs?: number;
  now?: () => Date;
};

export class CosmaxxAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CosmaxxAdapterError";
  }
}

function validateRequest(request: OptimizationRequest): string[] {
  const errors: string[] = [];

  if (request.schema_version !== COSMAXX_CONTRACT_VERSION) {
    errors.push("Unsupported COSMAXX contract version.");
  }
  if (!request.request_id?.trim()) errors.push("request_id is required.");
  if (!request.trace_id?.trim()) errors.push("trace_id is required.");
  if (!COSMOS_DOMAIN_IDS.includes(request.domain_id)) {
    errors.push("domain_id is not registered in the COSMOS domain set.");
  }
  if (!request.operation?.trim()) errors.push("operation is required.");
  if (!request.created_at || Number.isNaN(Date.parse(request.created_at))) {
    errors.push("created_at must be a valid ISO-compatible timestamp.");
  }
  if (!request.context || typeof request.context !== "object" || Array.isArray(request.context)) {
    errors.push("context must be an object.");
  }
  if (!Array.isArray(request.evidence_refs)) {
    errors.push("evidence_refs must be an array.");
  }
  if (!Array.isArray(request.requested_capabilities)) {
    errors.push("requested_capabilities must be an array.");
  }

  return errors;
}

function validateRecommendations(
  domainId: OptimizationRequest["domain_id"],
  recommendations: OptimizationRecommendation[],
): string[] {
  if (!Array.isArray(recommendations)) {
    return ["Optimizer returned an invalid recommendations payload."];
  }

  const errors: string[] = [];
  for (const item of recommendations) {
    if (!item.id?.trim() || !item.title?.trim() || !item.rationale?.trim()) {
      errors.push("Each recommendation requires an id, title and rationale.");
    }
    if (item.domain_id !== domainId) {
      errors.push("Recommendation domain_id does not match the request domain.");
    }
    if (item.requires_approval !== true) {
      errors.push("All recommendations must retain the human-approval requirement.");
    }
    if (item.confidence !== undefined && (item.confidence < 0 || item.confidence > 1)) {
      errors.push("Recommendation confidence must be between 0 and 1.");
    }
  }
  return errors;
}

/**
 * Recommendation-only boundary between COSMOS Runtime and COSMAXX.
 * This adapter never executes recommendations or grants capabilities.
 */
export class CosmaxxRuntimeAdapter {
  private readonly timeoutMs: number;
  private readonly now: () => Date;

  constructor(private readonly options: CosmaxxRuntimeAdapterOptions) {
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.now = options.now ?? (() => new Date());

    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new CosmaxxAdapterError("timeoutMs must be a positive finite number.");
    }
  }

  async evaluate(request: OptimizationRequest): Promise<OptimizationResult> {
    const base = {
      contract_version: COSMAXX_CONTRACT_VERSION,
      request_id: request.request_id,
      trace_id: request.trace_id,
      domain_id: request.domain_id,
    } as const;

    const requestErrors = validateRequest(request);
    if (requestErrors.length > 0) {
      return this.result(base, "rejected", [], requestErrors);
    }

    let authorization: AuthorizationDecision;
    try {
      authorization = await this.options.authorization.authorize(request);
    } catch {
      return this.result(base, "failed", [], ["Authorization service unavailable."]);
    }

    if (!authorization.allowed) {
      return this.result(
        base,
        "rejected",
        [],
        [authorization.reason ?? "Request not authorized."],
      );
    }

    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new CosmaxxAdapterError("COSMAXX optimizer timed out."));
        }, this.timeoutMs);
      });

      const recommendations = await Promise.race([
        this.options.optimizer.optimize(request, controller.signal),
        timeoutPromise,
      ]);

      const recommendationErrors = validateRecommendations(
        request.domain_id,
        recommendations,
      );
      if (recommendationErrors.length > 0) {
        return this.result(base, "failed", [], recommendationErrors);
      }

      return this.result(base, "completed", recommendations, []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown optimizer failure.";
      return this.result(base, "failed", [], [message]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private result(
    base: {
      contract_version: typeof COSMAXX_CONTRACT_VERSION;
      request_id: string;
      trace_id: string;
      domain_id: OptimizationRequest["domain_id"];
    },
    status: OptimizationResult["status"],
    recommendations: OptimizationRecommendation[],
    errors: string[],
  ): OptimizationResult {
    return {
      ...base,
      status,
      recommendations,
      errors,
      completed_at: this.now().toISOString(),
    };
  }
}
