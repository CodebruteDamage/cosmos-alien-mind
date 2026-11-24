export type GuidanceRiskClass = "R0" | "R1" | "R2" | "R3";
export type GuidanceDecision =
  | "PROCEED"
  | "GATHER_EVIDENCE"
  | "INVOKE_CRAFT"
  | "REQUIRE_APPROVAL"
  | "DEFER"
  | "DENY"
  | "STOP"
  | "NO_ACTION";

export type GuidanceDecisionInput = {
  objective: string;
  objectiveSatisfied: boolean;
  guidance: {
    recommendation: string;
    scopeIncluded: boolean;
    buildRequired: boolean;
    policyDenied?: boolean;
  };
  evidence: {
    sufficient: boolean;
    refs: string[];
    confidence: number;
  };
  blockers: Array<{
    id: string;
    summary: string;
    verified: boolean;
  }>;
  riskClass: GuidanceRiskClass;
  dependenciesSatisfied: boolean;
  approvalValid: boolean;
  stopRequested: boolean;
};

export type GuidanceDecisionResult = {
  decision: GuidanceDecision;
  reason: string;
  nextAction: string;
  evidenceRefs: string[];
  verifiedBlockerIds: string[];
  craftRequired: boolean;
  buildRequired: boolean;
  approvalRequired: boolean;
  executionStarted: false;
};

const RISK_CLASSES: GuidanceRiskClass[] = ["R0", "R1", "R2", "R3"];

function assertInput(input: GuidanceDecisionInput): void {
  if (!input || typeof input !== "object") throw new TypeError("A guidance decision input is required");
  if (!input.objective?.trim()) throw new TypeError("objective is required");
  if (!input.guidance?.recommendation?.trim()) throw new TypeError("guidance.recommendation is required");
  if (typeof input.guidance.scopeIncluded !== "boolean" || typeof input.guidance.buildRequired !== "boolean") {
    throw new TypeError("Guidance scopeIncluded and buildRequired must be explicit booleans");
  }
  if (!input.evidence || typeof input.evidence.sufficient !== "boolean" || !Array.isArray(input.evidence.refs)) {
    throw new TypeError("Evidence sufficiency and references are required");
  }
  if (!Number.isFinite(input.evidence.confidence) || input.evidence.confidence < 0 || input.evidence.confidence > 1) {
    throw new TypeError("Evidence confidence must be between 0 and 1");
  }
  if (!Array.isArray(input.blockers)) throw new TypeError("blockers must be an array");
  if (!RISK_CLASSES.includes(input.riskClass)) throw new TypeError("riskClass must be R0, R1, R2, or R3");
  if (typeof input.dependenciesSatisfied !== "boolean" || typeof input.approvalValid !== "boolean" ||
      typeof input.stopRequested !== "boolean" || typeof input.objectiveSatisfied !== "boolean") {
    throw new TypeError("Decision control flags must be explicit booleans");
  }
  for (const blocker of input.blockers) {
    if (!blocker.id?.trim() || !blocker.summary?.trim() || typeof blocker.verified !== "boolean") {
      throw new TypeError("Each blocker requires an id, summary, and verified flag");
    }
  }
}

export function decideGuidance(input: GuidanceDecisionInput): GuidanceDecisionResult {
  assertInput(input);

  const evidenceRefs = input.evidence.refs.filter((ref) => typeof ref === "string" && ref.trim().length > 0);
  const verifiedBlockerIds = input.blockers.filter((blocker) => blocker.verified).map((blocker) => blocker.id);
  const approvalRequiredByRisk = input.riskClass === "R2" || input.riskClass === "R3";

  const result = (
    decision: GuidanceDecision,
    reason: string,
    nextAction: string,
    options: Partial<Pick<GuidanceDecisionResult, "craftRequired" | "buildRequired" | "approvalRequired">> = {},
  ): GuidanceDecisionResult => ({
    decision,
    reason,
    nextAction,
    evidenceRefs,
    verifiedBlockerIds,
    craftRequired: options.craftRequired ?? false,
    buildRequired: options.buildRequired ?? false,
    approvalRequired: options.approvalRequired ?? false,
    executionStarted: false,
  });

  if (input.stopRequested) {
    return result("STOP", "A stop request is active.", "Stop this lifecycle and preserve its current evidence.");
  }
  if (input.guidance.policyDenied) {
    return result("DENY", "The guidance is explicitly denied by policy.", "Record the denial; do not route to CRAFT or execution.");
  }
  if (!input.guidance.scopeIncluded) {
    return result("DENY", "The proposed work is outside the guidance scope.", "Revise the guidance scope before considering this action.");
  }
  if (input.objectiveSatisfied) {
    return result("NO_ACTION", "The objective is already satisfied.", "Record completion evidence; do not create additional work.");
  }
  if (!input.evidence.sufficient || evidenceRefs.length === 0) {
    return result("GATHER_EVIDENCE", "Evidence is insufficient or has no traceable references.", "Run the smallest in-scope read-only check needed to resolve the uncertainty.");
  }
  if (!input.dependenciesSatisfied) {
    return result("DEFER", "A required dependency is not satisfied.", "Identify the missing prerequisite and resume only after it is verified.");
  }
  if (verifiedBlockerIds.length > 0) {
    return result("INVOKE_CRAFT", "One or more blockers are verified and require targeted remediation guidance.", "Send only the verified blockers and their evidence references to CRAFT.", { craftRequired: true });
  }
  if (approvalRequiredByRisk && !input.approvalValid) {
    return result("REQUIRE_APPROVAL", "The proposed action is R2/R3 and lacks valid action-specific approval.", "Pause and obtain approval bound to the exact action, target, and parameters.", { approvalRequired: true });
  }

  return result(
    "PROCEED",
    "Guidance is in scope, evidence-backed, dependency-ready, and satisfies the decision policy.",
    "Pass the scoped recommendation to the authorized orchestrator for its independent WARP GATE check.",
    { buildRequired: input.guidance.buildRequired },
  );
}
