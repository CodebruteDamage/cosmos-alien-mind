export const COSMAXX_DOMAIN_IDS = [
  "THINK",
  "KNOW",
  "ACT",
  "GOVERN",
  "ADAPT",
  "COMPANION",
  "EVOLVE",
] as const;

export type CosmaxxDomainId = (typeof COSMAXX_DOMAIN_IDS)[number];
export type DomainAssessmentStatus = "NOT_ASSESSED" | "IN_REVIEW" | "PASS" | "GAP" | "BLOCKED";

export type CosmaxxDomainDefinition = {
  id: CosmaxxDomainId;
  purpose: string;
  evaluationAreas: readonly string[];
  requiredEvidence: readonly string[];
};

export type CosmaxxDomainAssessment = {
  domainId: CosmaxxDomainId;
  status: DomainAssessmentStatus;
  score: null;
  evidenceRefs: readonly string[];
  gaps: readonly string[];
  assessedAt: null;
};

export const COSMAXX_SEVEN_DOMAIN_REGISTRY: readonly CosmaxxDomainDefinition[] = Object.freeze([
  { id: "THINK", purpose: "Reasoning quality and decision consistency", evaluationAreas: ["reasoning_quality", "decision_consistency", "planning_quality"], requiredEvidence: ["test_or_review_reference", "decision_trace"] },
  { id: "KNOW", purpose: "Evidence quality and knowledge accuracy", evaluationAreas: ["evidence_quality", "retrieval_accuracy", "knowledge_freshness"], requiredEvidence: ["source_reference", "verification_result"] },
  { id: "ACT", purpose: "Execution reliability and integration correctness", evaluationAreas: ["execution_reliability", "adapter_contracts", "failure_recovery"], requiredEvidence: ["integration_test", "runtime_result"] },
  { id: "GOVERN", purpose: "Permission enforcement and auditability", evaluationAreas: ["policy_enforcement", "permission_boundaries", "audit_traceability"], requiredEvidence: ["policy_test", "authorization_trace"] },
  { id: "ADAPT", purpose: "Feedback handling and controlled recovery", evaluationAreas: ["feedback_handling", "recovery_behavior", "state_consistency"], requiredEvidence: ["failure_path_test", "recovery_trace"] },
  { id: "COMPANION", purpose: "Context continuity and interaction quality", evaluationAreas: ["context_continuity", "instruction_alignment", "interaction_quality"], requiredEvidence: ["scenario_test", "conversation_trace"] },
  { id: "EVOLVE", purpose: "Architecture improvement and capability maturity", evaluationAreas: ["architecture_quality", "regression_control", "maintainability"], requiredEvidence: ["architecture_review", "regression_test"] },
]);

export function createUnassessedDomainSnapshot(): readonly CosmaxxDomainAssessment[] {
  return COSMAXX_SEVEN_DOMAIN_REGISTRY.map(({ id }) => Object.freeze({
    domainId: id,
    status: "NOT_ASSESSED" as const,
    score: null,
    evidenceRefs: Object.freeze([] as string[]),
    gaps: Object.freeze([] as string[]),
    assessedAt: null,
  }));
}

export function getCosmaxxDomain(domainId: CosmaxxDomainId): CosmaxxDomainDefinition {
  const domain = COSMAXX_SEVEN_DOMAIN_REGISTRY.find((item) => item.id === domainId);
  if (!domain) throw new TypeError("Unknown COSMAXX domain: " + domainId);
  return domain;
}
