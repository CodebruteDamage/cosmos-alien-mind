export const GAP_CYCLE_VERSION = "1.0.0";

export const GAP_CYCLE_STAGES = [
  { id: "GAP", name: "GAP", purpose: "Register the problem, opportunity, blocker, or improvement." },
  { id: "ANALYSIS", name: "ANALYSIS", purpose: "Analyze the stated objective and available evidence." },
  { id: "PARALYSIS", name: "PARALYSIS", purpose: "Hold progression while uncertainty, risk, or missing authority is unresolved." },
  { id: "ROOT_CAUSE", name: "ROOT CAUSE", purpose: "Identify and evidence the underlying cause." },
  { id: "SHAPE", name: "SHAPE", purpose: "Define the smallest in-scope solution and acceptance criteria." },
  { id: "OPTIMIZATION", name: "OPTIMIZATION", purpose: "Remove unnecessary complexity and optimize the proposed approach." },
  { id: "PROVISION", name: "PROVISION", purpose: "Verify dependencies, environment, and required resources." },
  { id: "BUILD", name: "BUILD", purpose: "Implement only the approved, in-scope change." },
  { id: "TEST", name: "TEST", purpose: "Run relevant automated and/or manual tests." },
  { id: "VALIDATE", name: "VALIDATE", purpose: "Verify acceptance criteria and runtime behavior." },
  { id: "CLOSE", name: "CLOSE", purpose: "Record evidence, acceptance, and closure decision." },
  { id: "EVOLVE", name: "EVOLVE", purpose: "Capture lessons and identify justified follow-on improvements." },
] as const;

export type GapStageId = (typeof GAP_CYCLE_STAGES)[number]["id"];
export type GapRiskClass = "R0" | "R1" | "R2" | "R3";

export type GapTransitionInput = {
  currentStageId: GapStageId | null;
  nextStageId: GapStageId;
  objective: string;
  evidenceRefs: string[];
  rationale?: string;
  scopeApproved: boolean;
  dependenciesSatisfied: boolean;
  riskClass: GapRiskClass;
  approvalValid: boolean;
  testsPassed: boolean;
  acceptanceCriteriaSatisfied: boolean;
  stopRequested: boolean;
};

export type GapTransitionResult = {
  allowed: boolean;
  status: "ADVANCE" | "HOLD" | "REWIND" | "STOP" | "INVALID";
  currentStageId: GapStageId | null;
  nextStageId: GapStageId;
  reason: string;
  requiredEvidence: string[];
};

const stageIndex = (id: GapStageId | null) =>
  id === null ? -1 : GAP_CYCLE_STAGES.findIndex((stage) => stage.id === id);

export function evaluateGapTransition(input: GapTransitionInput): GapTransitionResult {
  if (!input || typeof input !== "object" || !input.objective?.trim()) {
    throw new TypeError("A non-empty objective is required.");
  }
  if (!Array.isArray(input.evidenceRefs) || input.evidenceRefs.some((ref) => typeof ref !== "string" || !ref.trim())) {
    throw new TypeError("Evidence references must be non-empty strings.");
  }
  const from = stageIndex(input.currentStageId);
  const to = stageIndex(input.nextStageId);
  if (to < 0 || (input.currentStageId !== null && from < 0)) {
    throw new TypeError("Unknown 12 GAP Cycle stage.");
  }
  if (input.stopRequested) {
    return { allowed: false, status: "STOP", currentStageId: input.currentStageId, nextStageId: input.nextStageId, reason: "Stop requested; preserve current state and evidence.", requiredEvidence: [] };
  }
  if (to !== from + 1 && !(to < from && input.rationale?.trim() && input.evidenceRefs.length > 0)) {
    return { allowed: false, status: "HOLD", currentStageId: input.currentStageId, nextStageId: input.nextStageId, reason: "Only the next sequential stage is allowed; backward iteration requires a rationale and evidence.", requiredEvidence: ["backward-iteration rationale", "traceable evidence"] };
  }
  if (to < from) {
    return { allowed: true, status: "REWIND", currentStageId: input.currentStageId, nextStageId: input.nextStageId, reason: "Evidence-backed backward iteration recorded.", requiredEvidence: [] };
  }
  if (input.nextStageId === "PARALYSIS") {
    return { allowed: true, status: "HOLD", currentStageId: input.currentStageId, nextStageId: input.nextStageId, reason: "Lifecycle is explicitly held for uncertainty, risk, or missing authority resolution.", requiredEvidence: [] };
  }
  const requiredEvidence: string[] = [];
  if (input.currentStageId !== null && input.evidenceRefs.length === 0) requiredEvidence.push("traceable evidence from the completed stage");
  if (input.nextStageId === "PROVISION" && !input.dependenciesSatisfied) requiredEvidence.push("verified dependency readiness");
  if (input.nextStageId === "BUILD") {
    if (!input.scopeApproved) requiredEvidence.push("explicit in-scope build authorization");
    if ((input.riskClass === "R2" || input.riskClass === "R3") && !input.approvalValid) requiredEvidence.push("action-specific approval for R2/R3 work");
  }
  if (input.nextStageId === "TEST" && !input.testsPassed) requiredEvidence.push("successful build output before testing can be recorded");
  if (input.nextStageId === "VALIDATE" && !input.testsPassed) requiredEvidence.push("passing test evidence");
  if ((input.nextStageId === "CLOSE" || input.nextStageId === "EVOLVE") && !input.acceptanceCriteriaSatisfied) requiredEvidence.push("verified acceptance criteria");
  if (requiredEvidence.length) {
    return { allowed: false, status: "HOLD", currentStageId: input.currentStageId, nextStageId: input.nextStageId, reason: "Stage gate requirements are not satisfied.", requiredEvidence };
  }
  return { allowed: true, status: "ADVANCE", currentStageId: input.currentStageId, nextStageId: input.nextStageId, reason: "Sequential stage transition is evidence-backed and its applicable gates are satisfied.", requiredEvidence: [] };
}
