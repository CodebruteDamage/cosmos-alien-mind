import {
  COSMAXX_CONTRACT_VERSION, COSMOS_DOMAIN_IDS,
  type AuthorizationDecision, type CosmaxxAuthorization, type CosmaxxOptimizer,
  type OptimizationRecommendation, type OptimizationRequest, type OptimizationResult,
} from "./contracts";

export type CosmaxxRuntimeAdapterOptions = {
  optimizer: CosmaxxOptimizer;
  authorization: CosmaxxAuthorization;
  timeoutMs?: number;
  authorizationTimeoutMs?: number;
  now?: () => Date;
};

export class CosmaxxAdapterError extends Error {
  constructor(message: string) { super(message); this.name = "CosmaxxAdapterError"; }
}

type RecordValue = Record<string, unknown>;
function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isDomainId(value: unknown): value is OptimizationRequest["domain_id"] {
  return typeof value === "string" && (COSMOS_DOMAIN_IDS as readonly string[]).includes(value);
}
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function validateEvidenceReferences(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) return [`${field} must be an array.`];
  const errors: string[] = [];
  value.forEach((entry, index) => {
    if (!isRecord(entry) || !isNonEmptyString(entry.id) || !isNonEmptyString(entry.source)) {
      errors.push(`${field}[${index}] requires non-empty id and source strings.`); return;
    }
    if (entry.digest !== undefined && !isNonEmptyString(entry.digest)) {
      errors.push(`${field}[${index}].digest must be a non-empty string when supplied.`);
    }
  });
  return errors;
}
function validateRequest(value: unknown): string[] {
  if (!isRecord(value)) return ["request must be an object."];
  const errors: string[] = [];
  if (value.schema_version !== COSMAXX_CONTRACT_VERSION) errors.push("Unsupported COSMAXX contract version.");
  if (!isNonEmptyString(value.request_id)) errors.push("request_id is required.");
  if (!isNonEmptyString(value.trace_id)) errors.push("trace_id is required.");
  if (!isDomainId(value.domain_id)) errors.push("domain_id is not registered in the COSMOS domain set.");
  if (!isNonEmptyString(value.operation)) errors.push("operation is required.");
  if (!isNonEmptyString(value.created_at) || !Number.isFinite(Date.parse(value.created_at))) {
    errors.push("created_at must be a valid timestamp.");
  }
  if (!isRecord(value.context)) errors.push("context must be an object.");
  errors.push(...validateEvidenceReferences(value.evidence_refs, "evidence_refs"));
  if (!Array.isArray(value.requested_capabilities)) errors.push("requested_capabilities must be an array.");
  else if (!value.requested_capabilities.every(isNonEmptyString)) {
    errors.push("requested_capabilities must contain only non-empty strings.");
  }
  return errors;
}
function validateRecommendations(domainId: OptimizationRequest["domain_id"], value: unknown): string[] {
  if (!Array.isArray(value)) return ["Optimizer returned an invalid recommendations payload."];
  const errors: string[] = [];
  value.forEach((entry, index) => {
    if (!isRecord(entry)) { errors.push(`recommendations[${index}] must be an object.`); return; }
    if (!isNonEmptyString(entry.id) || !isNonEmptyString(entry.title) || !isNonEmptyString(entry.rationale)) {
      errors.push("Each recommendation requires an id, title and rationale.");
    }
    if (entry.domain_id !== domainId) errors.push("Recommendation domain_id does not match the request domain.");
    if (entry.requires_approval !== true) errors.push("All recommendations must retain the human-approval requirement.");
    if (entry.confidence !== undefined && (typeof entry.confidence !== "number" ||
      !Number.isFinite(entry.confidence) || entry.confidence < 0 || entry.confidence > 1)) {
      errors.push("Recommendation confidence must be a finite number between 0 and 1.");
    }
    if (!["low", "medium", "high", "critical"].includes(String(entry.impact))) {
      errors.push("Recommendation impact must be low, medium, high or critical.");
    }
    errors.push(...validateEvidenceReferences(entry.evidence_refs, `recommendations[${index}].evidence_refs`));
  });
  return errors;
}
function validateAuthorization(value: unknown): value is AuthorizationDecision {
  return isRecord(value) && typeof value.allowed === "boolean" &&
    (value.reason === undefined || typeof value.reason === "string");
}

/** Recommendation-only boundary. This adapter never executes recommendations or grants capabilities. */
export class CosmaxxRuntimeAdapter {
  private readonly timeoutMs: number;
  private readonly authorizationTimeoutMs: number;
  private readonly now: () => Date;
  constructor(private readonly options: CosmaxxRuntimeAdapterOptions) {
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.authorizationTimeoutMs = options.authorizationTimeoutMs ?? 5_000;
    this.now = options.now ?? (() => new Date());
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new CosmaxxAdapterError("timeoutMs must be a positive finite number.");
    }
    if (!Number.isFinite(this.authorizationTimeoutMs) || this.authorizationTimeoutMs <= 0) {
      throw new CosmaxxAdapterError("authorizationTimeoutMs must be a positive finite number.");
    }
  }
  async evaluate(request: OptimizationRequest): Promise<OptimizationResult> {
    const raw = isRecord(request) ? request : {};
    const base = {
      contract_version: COSMAXX_CONTRACT_VERSION,
      request_id: typeof raw.request_id === "string" ? raw.request_id : "",
      trace_id: typeof raw.trace_id === "string" ? raw.trace_id : "",
      domain_id: isDomainId(raw.domain_id) ? raw.domain_id : "THINK",
    } as const;
    const requestErrors = validateRequest(request);
    if (requestErrors.length) return this.result(base, "rejected", [], requestErrors);
    const validRequest = request as OptimizationRequest;
    let authorization: unknown;
    try {
      authorization = await this.withTimeout(
        this.options.authorization.authorize(validRequest), this.authorizationTimeoutMs,
        "COSMAXX authorization timed out.",
      );
    } catch (error) {
      return this.result(base, "failed", [], [error instanceof CosmaxxAdapterError ? error.message : "Authorization service unavailable."]);
    }
    if (!validateAuthorization(authorization)) {
      return this.result(base, "failed", [], ["Authorization service returned a malformed decision."]);
    }
    if (!authorization.allowed) {
      const reason = authorization.reason?.trim() || "Request not authorized.";
      return this.result(base, "rejected", [], [reason]);
    }
    const controller = new AbortController();
    try {
      const recommendations = await this.withTimeout(
        this.options.optimizer.optimize(validRequest, controller.signal), this.timeoutMs,
        "COSMAXX optimizer timed out.", () => controller.abort(),
      );
      const recommendationErrors = validateRecommendations(validRequest.domain_id, recommendations);
      if (recommendationErrors.length) return this.result(base, "failed", [], recommendationErrors);
      return this.result(base, "completed", recommendations as OptimizationRecommendation[], []);
    } catch (error) {
      return this.result(base, "failed", [], [error instanceof CosmaxxAdapterError ? error.message : "Optimizer failed."]);
    }
  }
  private async withTimeout<T>(operation: Promise<T>, timeoutMs: number, message: string, onTimeout?: () => void): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([operation, new Promise<never>((_, reject) => {
        timer = setTimeout(() => { onTimeout?.(); reject(new CosmaxxAdapterError(message)); }, timeoutMs);
      })]);
    } finally { if (timer) clearTimeout(timer); }
  }
  private result(
    base: { contract_version: typeof COSMAXX_CONTRACT_VERSION; request_id: string; trace_id: string; domain_id: OptimizationRequest["domain_id"] },
    status: OptimizationResult["status"], recommendations: OptimizationRecommendation[], errors: string[],
  ): OptimizationResult {
    return { ...base, status, recommendations, errors, completed_at: this.now().toISOString() };
  }
}
