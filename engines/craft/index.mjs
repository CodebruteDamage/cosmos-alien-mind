const DIMENSIONS = ["complexity", "risk", "urgency", "dependency"];

function assertScore(value, name) {
  if (!Number.isFinite(value) || value < 0 || value > 5) {
    throw new TypeError(name + " must be a number from 0 to 5");
  }
}

export function assessBlocker(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("A blocker object is required");
  }
  if (typeof input.id !== "string" || !input.id.trim()) {
    throw new TypeError("blocker.id is required");
  }
  if (typeof input.summary !== "string" || !input.summary.trim()) {
    throw new TypeError("blocker.summary is required");
  }
  for (const dimension of DIMENSIONS) assertScore(input[dimension], dimension);
  const confidence = input.confidence ?? 3;
  assertScore(confidence, "confidence");

  const priorityScore = Number((
    input.risk * 0.35 + input.urgency * 0.25 +
    input.complexity * 0.20 + input.dependency * 0.20
  ).toFixed(2));

  const priority = priorityScore >= 4 ? "critical"
    : priorityScore >= 3 ? "high"
    : priorityScore >= 2 ? "moderate" : "low";
  const evidenceRequired = confidence < 3;
  const recommendedNextStep = evidenceRequired
    ? "Collect missing evidence and reassess before remediation."
    : priority === "critical"
      ? "Escalate for human review; use an approved runbook."
      : priority === "high"
        ? "Assign an owner, confirm dependencies, and prepare a reviewed remediation plan."
        : priority === "moderate"
          ? "Break the blocker into smaller tasks and schedule a review."
          : "Record the blocker and monitor for change.";

  return Object.freeze({
    id: input.id, summary: input.summary, priorityScore, priority,
    confidence, evidenceRequired, recommendedNextStep,
    context: Object.freeze({
      gapCycleId: input.gapCycleId ?? null,
      gapStageId: input.gapStageId ?? null,
      source: input.source ?? "unspecified"
    }),
    decision: "recommendation_only",
    requiresHumanApproval: true
  });
}

export function assessBlockers(blockers) {
  if (!Array.isArray(blockers)) throw new TypeError("blockers must be an array");
  return blockers.map(assessBlocker).sort((a, b) => b.priorityScore - a.priorityScore);
}
