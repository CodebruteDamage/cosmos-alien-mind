import { generateBuildGuidance } from "../build-guidance/engine.mjs";
import { evaluateEvidence } from "../evidence-engine/engine.mjs";
import { attachEvidenceAssessment } from "../build-guidance/evidence-adapter.mjs";
import { triageCraft } from "../craft/engine.mjs";

const SEVERITY = Object.freeze({
  critical: { impact: 5, urgency: 5 },
  high: { impact: 4, urgency: 4 },
  medium: { impact: 3, urgency: 3 },
  low: { impact: 2, urgency: 2 }
});

function deriveBlockers(risks = []) {
  const blockers = [{
    id: "repository-baseline",
    title: "Repository baseline and restore point require verification",
    description: "The target branch, commit, dependency state and recovery artifact must be inspected before implementation.",
    impact: 4,
    likelihood: 4,
    urgency: 5,
    evidenceConfidence: 0,
    evidenceStatus: "UNVERIFIED"
  }];

  for (const risk of risks) {
    const dimensions = SEVERITY[risk.severity] ?? SEVERITY.medium;
    blockers.push({
      id: risk.id,
      title: risk.reason,
      description: risk.reason,
      impact: dimensions.impact,
      likelihood: 3,
      urgency: dimensions.urgency,
      evidenceConfidence: 0,
      evidenceStatus: "UNVERIFIED"
    });
  }
  return blockers;
}

function buildStages(evidenceSupplied) {
  return [
    { id: "INSPECT", name: "Repository inspection", status: "REQUIRED", output: "Verified branch, commit, tree, dependencies and restore point" },
    { id: "EVIDENCE", name: "Evidence assessment", status: evidenceSupplied ? "REVIEW_REQUIRED" : "REQUIRED", output: "Provenance-aware findings, conflicts and known gaps" },
    { id: "GUIDANCE", name: "Build guidance", status: "COMPLETE", output: "Build types, profile, modules, milestones and acceptance gates" },
    { id: "CRAFT", name: "Blocker triage", status: "COMPLETE", output: "Deterministic blocker ranking and recommended remediation order" },
    { id: "POLICY", name: "Policy and capability review", status: "REQUIRED", output: "Least-privilege capability request and approval record" },
    { id: "PROVISION", name: "Isolated provisioning", status: "BLOCKED", output: "Approved feature branch and bounded work package" },
    { id: "IMPLEMENT", name: "Incremental implementation", status: "BLOCKED", output: "Small, reviewable changes with preserved working behavior" },
    { id: "VALIDATE", name: "Independent validation", status: "PENDING", output: "Unit, contract, integration, security and regression results" },
    { id: "CERTIFY", name: "Evidence certification", status: "PENDING", output: "Evidence-backed acceptance report and unresolved risks" },
    { id: "RELEASE", name: "Release decision", status: "BLOCKED", output: "Separate human approval for production or destructive changes" }
  ];
}

/**
 * COSMOS AUTO-RECO v1.0
 * Composes Guidance, Evidence and CRAFT into one build recommendation.
 * It is planning-only: it cannot create branches, write files, execute tools,
 * issue WARP GATE grants, deploy or approve a release.
 */
export function generateAutoRecommendation(input = {}) {
  const objective = typeof input.objective === "string" ? input.objective.trim() : "";
  if (objective.length < 12 || objective.length > 4000) {
    throw new TypeError("objective must contain between 12 and 4000 characters");
  }

  const guidanceInput = {
    objective,
    repository: input.repository,
    buildTypes: input.buildTypes,
    profile: input.profile
  };
  let guidance = generateBuildGuidance(guidanceInput);

  let evidenceReport = null;
  const evidenceSupplied = Array.isArray(input.evidenceRecords) && input.evidenceRecords.length > 0;
  if (evidenceSupplied) {
    evidenceReport = evaluateEvidence(
      { records: input.evidenceRecords },
      { maxAgeDays: input.evidenceMaxAgeDays }
    );
    guidance = attachEvidenceAssessment(guidance, evidenceReport);
  }

  const blockers = Array.isArray(input.blockers) && input.blockers.length > 0
    ? input.blockers
    : deriveBlockers(guidance.riskAssessment);
  const craft = triageCraft({ blockers });

  const riskRequiresApproval = guidance.classification.profile.id === "PRODUCTION"
    || guidance.riskAssessment.some(item => ["critical", "high"].includes(item.severity));
  const evidenceNeedsReview = !evidenceReport
    || evidenceReport.conflictCount > 0
    || evidenceReport.counts.UNVERIFIED > 0
    || evidenceReport.counts.CONFLICTED > 0
    || evidenceReport.counts.STALE > 0;

  return {
    schema: "cosmos.auto-reco.v1",
    engine: { name: "COSMOS AUTO-RECO", version: "1.0.0", mode: "orchestrated-recommendation" },
    generatedAt: new Date().toISOString(),
    objective,
    repository: input.repository ?? null,
    recommendationOnly: true,
    executionAuthorized: false,
    guidance,
    evidence: evidenceReport ? {
      status: evidenceNeedsReview ? "REVIEW_REQUIRED" : "ASSESSED",
      recordCount: evidenceReport.recordCount,
      counts: evidenceReport.counts,
      conflictCount: evidenceReport.conflictCount,
      overallConfidence: evidenceReport.overallConfidence,
      limitations: evidenceReport.limitations
    } : {
      status: "EVIDENCE_REQUIRED",
      recordCount: 0,
      counts: null,
      conflictCount: 0,
      overallConfidence: null,
      limitations: ["No repository or runtime evidence was supplied; no finding is treated as verified."]
    },
    craft,
    providerPlan: {
      selectedProvider: "claude",
      adapterRole: "reasoning provider behind the COSMOS REA provider contract",
      status: "VERIFY_ADAPTER_AND_CREDENTIAL_CONFIGURATION",
      liveApiTestPerformed: false,
      secretBoundary: "ANTHROPIC_API_KEY must remain in approved server-side secret storage; never expose it to clients or commit it."
    },
    lifecycle: {
      stages: buildStages(evidenceSupplied),
      executionGate: {
        authority: "WARP GATE",
        decision: "NOT_REQUESTED",
        defaultDecision: "DENY",
        reason: "No trusted server-side WARP GATE decision or verified single-use grant is available to this planning engine."
      },
      requiresHumanApproval: riskRequiresApproval,
      releaseEligible: false,
      nextAction: evidenceNeedsReview
        ? "Run read-only Inspector discovery, attach source-backed evidence, and resolve conflicts before requesting provisioning."
        : "Verify the repository baseline and request the minimum required capability through WARP GATE."
    },
    governance: {
      policyAuthority: "WARP GATE",
      defaultDecision: "DENY",
      planningIsNotPermission: true,
      agentOutputIsUntrusted: true,
      privilegedOperationsRequireScopedAuthorization: true,
      productionOrDestructiveChangesRequireHumanApproval: true,
      noArbitraryShellOrUnboundedRemoteExecution: true
    },
    limitations: [
      "This engine composes recommendations only; it does not provision or execute a build.",
      "Evidence is stateless and is not persisted by this engine.",
      "CRAFT scores are deterministic prioritization heuristics, not probabilities.",
      "Repository branch, commit, dependencies and restore point must be verified independently.",
      "Live Claude API connectivity and WARP GATE runtime connectivity are not tested here."
    ]
  };
}
