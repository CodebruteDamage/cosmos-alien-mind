export const COSMOS_TASK_LIFECYCLE_VERSION = "1.0" as const;

export const TASK_STATES = [
  "CREATED", "INTAKE", "OWNED", "PRESCANNED", "ANALYZED", "PLANNED",
  "AWAITING_APPROVAL", "AUTHORIZED", "EXECUTING", "VALIDATING", "COMPLETED",
  "BLOCKED", "REJECTED", "NEEDS_REAPPROVAL", "RECOVERING", "FAILED", "CANCELLED",
] as const;

export type TaskState = (typeof TASK_STATES)[number];

const TERMINAL_STATES = new Set<TaskState>(["COMPLETED", "REJECTED", "FAILED", "CANCELLED"]);

const ALLOWED_TRANSITIONS: Record<TaskState, readonly TaskState[]> = {
  CREATED: ["INTAKE", "BLOCKED", "CANCELLED"],
  INTAKE: ["OWNED", "BLOCKED", "REJECTED", "CANCELLED"],
  OWNED: ["PRESCANNED", "BLOCKED", "CANCELLED"],
  PRESCANNED: ["ANALYZED", "BLOCKED", "CANCELLED"],
  ANALYZED: ["PLANNED", "BLOCKED", "CANCELLED"],
  PLANNED: ["AWAITING_APPROVAL", "AUTHORIZED", "BLOCKED", "CANCELLED"],
  AWAITING_APPROVAL: ["AUTHORIZED", "REJECTED", "NEEDS_REAPPROVAL", "BLOCKED", "CANCELLED"],
  AUTHORIZED: ["EXECUTING", "NEEDS_REAPPROVAL", "BLOCKED", "CANCELLED"],
  EXECUTING: ["VALIDATING", "NEEDS_REAPPROVAL", "RECOVERING", "BLOCKED", "FAILED", "CANCELLED"],
  VALIDATING: ["COMPLETED", "RECOVERING", "BLOCKED", "FAILED"],
  COMPLETED: [],
  BLOCKED: ["RECOVERING", "REJECTED", "CANCELLED"],
  REJECTED: [],
  NEEDS_REAPPROVAL: ["AWAITING_APPROVAL", "BLOCKED", "CANCELLED"],
  RECOVERING: ["OWNED", "PRESCANNED", "ANALYZED", "PLANNED", "AWAITING_APPROVAL", "FAILED", "CANCELLED"],
  FAILED: [],
  CANCELLED: [],
};

export type TaskTransitionInput = {
  from: TaskState;
  to: TaskState;
  actorSubject: string;
  reason: string;
  expectedVersion: number;
  evidenceRefs?: string[];
  warpGateDecisionVerified?: boolean;
  humanApprovalVerified?: boolean;
  validationPassed?: boolean;
  auditPassed?: boolean;
};

export type TaskTransitionResult =
  | { allowed: true; nextVersion: number; requiredEvidence: string[] }
  | { allowed: false; reason: string };

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Pure lifecycle policy. The caller must still persist transitions atomically,
 * verify WARP GATE grants using the trusted host, and enforce approval/audit
 * evidence at the database/runtime boundary. Boolean flags here are not grants.
 */
export function evaluateTaskTransition(input: TaskTransitionInput): TaskTransitionResult {
  if (!TASK_STATES.includes(input.from) || !TASK_STATES.includes(input.to)) {
    return { allowed: false, reason: "Unknown task lifecycle state." };
  }
  if (!nonEmpty(input.actorSubject) || !nonEmpty(input.reason)) {
    return { allowed: false, reason: "A trusted actor and transition reason are required." };
  }
  if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 1) {
    return { allowed: false, reason: "A positive expected task version is required." };
  }
  if (TERMINAL_STATES.has(input.from)) {
    return { allowed: false, reason: "Terminal task states cannot transition." };
  }
  if (!ALLOWED_TRANSITIONS[input.from].includes(input.to)) {
    return { allowed: false, reason: `Transition ${input.from} -> ${input.to} is not permitted.` };
  }

  const evidenceRefs = input.evidenceRefs ?? [];
  if (!Array.isArray(evidenceRefs) || !evidenceRefs.every(nonEmpty)) {
    return { allowed: false, reason: "Evidence references must be non-empty strings." };
  }

  if (input.to === "AUTHORIZED" && input.warpGateDecisionVerified !== true) {
    return { allowed: false, reason: "A verified WARP GATE ALLOW decision is required." };
  }
  if (input.to === "AUTHORIZED" && input.humanApprovalVerified !== true &&
      (input.from === "AWAITING_APPROVAL")) {
    return { allowed: false, reason: "The required human approval is not verified." };
  }
  if (input.to === "COMPLETED" && (input.validationPassed !== true || input.auditPassed !== true)) {
    return { allowed: false, reason: "Independent validation and audit must both pass before closure." };
  }

  const requiredEvidence = ["actor", "reason", "correlation_id", "contract_version"];
  if (input.to === "AUTHORIZED") requiredEvidence.push("warp_gate_decision");
  if (input.to === "COMPLETED") requiredEvidence.push("validation_report", "audit_report");
  return { allowed: true, nextVersion: input.expectedVersion + 1, requiredEvidence };
}
