export const COSMOS_TASK_OWNERSHIP_VERSION = "1.1" as const;

export const TASK_OWNER_BY_CATEGORY = {
  architecture: "SHAPE",
  optimization: "COSMAXX",
  runtime_hardening: "COSMAXX",
  development: "DEVOPS",
  operations: "DEVOPS",
  security: "DEFENDER",
  threat_protection: "FORCEFIELD",
  workflow_integration: "HOOKS",
  blocker: "CRAFT",
  validation: "12_GAP_CYCLE",
  discovery: "DISCOVERY",
  general: "ORCH",
} as const;

export const TASK_OWNER_BY_SUBJECT = {
  architecture: "SHAPE",
  governance: "SHAPE",
  guidance: "ORCH",
  cosmaxx: "COSMAXX",
  craft: "CRAFT",
  devops: "DEVOPS",
  security: "DEFENDER",
  threat_protection: "FORCEFIELD",
  workflow_integration: "HOOKS",
  orchestration: "ORCH",
  evidence: "CME_EVIDENCE_ENGINE",
  validation: "12_GAP_CYCLE",
  discovery: "DISCOVERY",
  general: "ORCH",
} as const;

export type CosmosTaskCategory = keyof typeof TASK_OWNER_BY_CATEGORY;
export type CosmosTaskSubject = keyof typeof TASK_OWNER_BY_SUBJECT;
export type CosmosTaskRisk = "read_only" | "side_effect" | "consequential";

export type ExecutionProviderCandidate = {
  id: string;
  capabilities: string[];
};

export type TaskOwnershipRequest = {
  taskId: string;
  /** Intended, outcome-oriented result. Required for every assignment. */
  objective: string;
  /** Canonical affected subsystem/domain. This is the primary ownership signal. */
  subject: CosmosTaskSubject;
  /** Explain why the subject is the correct domain for the stated objective. */
  alignmentRationale: string;
  description: string;
  /** Secondary classification; it never overrides subject ownership. */
  category: CosmosTaskCategory;
  risk: CosmosTaskRisk;
  requiredCapabilities: string[];
  executionProviders: ExecutionProviderCandidate[];
  preferredExecutionProvider?: string;
  acceptanceCriteria: string[];
};

export type TaskOwnershipAssignment = {
  policyVersion: typeof COSMOS_TASK_OWNERSHIP_VERSION;
  taskId: string;
  objective: string;
  subject: CosmosTaskSubject;
  alignmentRationale: string;
  status: "assigned" | "blocked";
  taskOwner: (typeof TASK_OWNER_BY_SUBJECT)[CosmosTaskSubject];
  ownerSelectionBasis: "subject";
  orchestrator: "ORCH";
  providerRouter: "TPO";
  executionProvider: string | null;
  blockerProvider: "CRAFT";
  validationProvider: "12_GAP_CYCLE";
  governanceProvider: "WARP_GATE";
  evidenceProvider: "CME_EVIDENCE_ENGINE";
  risk: CosmosTaskRisk;
  requiresWarpGateAuthorization: boolean;
  requiresHumanApproval: boolean;
  dispatchReady: boolean;
  blockers: string[];
};

const REQUIRED_OWNERSHIP_ROLES = {
  orchestrator: "ORCH",
  providerRouter: "TPO",
  blockerProvider: "CRAFT",
  validationProvider: "12_GAP_CYCLE",
  governanceProvider: "WARP_GATE",
  evidenceProvider: "CME_EVIDENCE_ENGINE",
} as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isUniqueStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString) &&
    new Set(value.map((entry) => entry.trim())).size === value.length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function eligibleProviders(
  request: TaskOwnershipRequest,
): ExecutionProviderCandidate[] {
  return request.executionProviders.filter((candidate) => {
    if (!isRecord(candidate) || !isNonEmptyString(candidate.id) ||
        !isUniqueStringArray(candidate.capabilities)) return false;
    return request.requiredCapabilities.every((capability) =>
      candidate.capabilities.includes(capability),
    );
  });
}

/**
 * Deterministic, fail-closed task ownership assignment.
 * The declared objective and canonical subject are mandatory. Subject ownership
 * is authoritative; category is secondary metadata and cannot override it.
 * This policy assigns responsibility only; it does not authorize or execute work.
 */
export function assignTaskOwnership(
  request: TaskOwnershipRequest,
): TaskOwnershipAssignment {
  const blockers: string[] = [];

  if (!isNonEmptyString(request.taskId)) blockers.push("A non-empty taskId is required.");
  if (!isNonEmptyString(request.objective)) blockers.push("A concrete task objective is required.");
  if (!isNonEmptyString(request.alignmentRationale)) {
    blockers.push("An objective-to-subject alignment rationale is required.");
  }
  if (!isNonEmptyString(request.description)) blockers.push("A task description is required.");
  if (!Object.prototype.hasOwnProperty.call(TASK_OWNER_BY_SUBJECT, request.subject)) {
    blockers.push("The task subject is not registered; ownership remains unassigned.");
  }
  if (!Object.prototype.hasOwnProperty.call(TASK_OWNER_BY_CATEGORY, request.category)) {
    blockers.push("The task category is not registered.");
  }
  if (![ "read_only", "side_effect", "consequential" ].includes(request.risk)) {
    blockers.push("A valid task risk classification is required.");
  }
  if (!isUniqueStringArray(request.requiredCapabilities) || request.requiredCapabilities.length === 0) {
    blockers.push("requiredCapabilities must contain at least one unique, non-empty capability.");
  }
  if (!Array.isArray(request.acceptanceCriteria) ||
      request.acceptanceCriteria.length === 0 ||
      !request.acceptanceCriteria.every(isNonEmptyString)) {
    blockers.push("At least one non-empty acceptance criterion is required.");
  }
  if (!Array.isArray(request.executionProviders)) {
    blockers.push("Execution provider candidates must be supplied.");
  }

  let selectedProvider: string | null = null;
  if (blockers.length === 0) {
    const eligible = eligibleProviders(request);
    if (request.preferredExecutionProvider) {
      const preferred = eligible.find((provider) =>
        provider.id === request.preferredExecutionProvider,
      );
      if (preferred) selectedProvider = preferred.id;
      else blockers.push("The preferred execution provider is unavailable or lacks required capabilities.");
    } else if (eligible.length === 1) {
      selectedProvider = eligible[0].id;
    } else if (eligible.length === 0) {
      blockers.push("No execution provider satisfies the required capabilities.");
    } else {
      blockers.push("Execution provider selection is ambiguous; specify a preferred provider.");
    }
  }

  const validRisk: CosmosTaskRisk = [ "read_only", "side_effect", "consequential" ].includes(request.risk)
    ? request.risk
    : "read_only";
  const requiresWarpGateAuthorization = validRisk !== "read_only";
  const requiresHumanApproval = validRisk === "consequential";

  return {
    policyVersion: COSMOS_TASK_OWNERSHIP_VERSION,
    taskId: isNonEmptyString(request.taskId) ? request.taskId : "UNASSIGNED",
    objective: isNonEmptyString(request.objective) ? request.objective : "",
    subject: request.subject,
    alignmentRationale: isNonEmptyString(request.alignmentRationale) ? request.alignmentRationale : "",
    status: blockers.length === 0 ? "assigned" : "blocked",
    taskOwner: TASK_OWNER_BY_SUBJECT[request.subject] ?? "ORCH",
    ownerSelectionBasis: "subject",
    orchestrator: REQUIRED_OWNERSHIP_ROLES.orchestrator,
    providerRouter: REQUIRED_OWNERSHIP_ROLES.providerRouter,
    executionProvider: selectedProvider,
    blockerProvider: REQUIRED_OWNERSHIP_ROLES.blockerProvider,
    validationProvider: REQUIRED_OWNERSHIP_ROLES.validationProvider,
    governanceProvider: REQUIRED_OWNERSHIP_ROLES.governanceProvider,
    evidenceProvider: REQUIRED_OWNERSHIP_ROLES.evidenceProvider,
    risk: validRisk,
    requiresWarpGateAuthorization,
    requiresHumanApproval,
    dispatchReady: blockers.length === 0 && !requiresWarpGateAuthorization,
    blockers,
  };
}
