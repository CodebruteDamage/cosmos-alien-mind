import { assessBlockers } from "../engines/craft/index.mjs";

export function runCraftForGuidance(decision, blockers) {
  if (!decision || decision.decision !== "INVOKE_CRAFT" || decision.craftRequired !== true) {
    return Object.freeze({
      invoked: false,
      status: "SKIPPED",
      reason: "Guidance did not authorize a CRAFT assessment."
    });
  }

  if (!Array.isArray(blockers)) {
    throw new TypeError("blockers must be an array");
  }

  const verifiedIds = new Set(decision.verifiedBlockerIds ?? []);
  const selected = blockers.filter((blocker) => blocker.verified === true && verifiedIds.has(blocker.id));
  if (selected.length === 0) {
    return Object.freeze({
      invoked: false,
      status: "GATHER_EVIDENCE",
      reason: "No matching verified blockers were supplied."
    });
  }

  const missingAssessment = selected
    .filter((blocker) => !blocker.assessment)
    .map((blocker) => blocker.id);
  if (missingAssessment.length > 0) {
    return Object.freeze({
      invoked: false,
      status: "GATHER_EVIDENCE",
      missingBlockerIds: Object.freeze(missingAssessment),
      reason: "Evidence-backed CRAFT dimensions and source references are required; no scores were inferred."
    });
  }

  const assessments = assessBlockers(selected.map((blocker) => ({
    id: blocker.id,
    summary: blocker.summary,
    ...blocker.assessment
  })));

  return Object.freeze({
    invoked: true,
    status: "RECOMMENDATION_ONLY",
    assessments: Object.freeze(assessments),
    requiresHumanApproval: true,
    executionStarted: false
  });
}
