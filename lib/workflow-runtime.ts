export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type ActionKind = "read" | "write" | "delete" | "external";

export type WorkflowStep = {
  id: string;
  capability: string;
  kind: ActionKind;
  risk: RiskLevel;
  input: Record<string, unknown>;
  timeoutMs?: number;
  retries?: number;
  retrySafe?: boolean;
};

export type WorkflowDefinition = {
  id: string;
  version: number;
  steps: WorkflowStep[];
  limits: {
    maxSteps: number;
    maxDurationMs: number;
    maxRetries: number;
  };
};

export type StepResult = {
  output: unknown;
  verified: boolean;
  evidence?: string[];
};

export type CapabilityContext = {
  workflowId: string;
  stepId: string;
  idempotencyKey: string;
  signal: AbortSignal;
};

export type CapabilityHandler = (
  input: Record<string, unknown>,
  context: CapabilityContext,
) => Promise<StepResult>;

export type PolicyDecision = {
  allowed: boolean;
  reason: string;
};

export type RuntimeEvent = {
  at: string;
  type: string;
  workflowId: string;
  stepId?: string;
  detail: Record<string, unknown>;
};

export type WorkflowRunResult = {
  workflowId: string;
  status: "completed" | "failed" | "blocked";
  outputs: Record<string, unknown>;
  events: RuntimeEvent[];
  error?: string;
};

export type WorkflowRuntimeOptions = {
  handlers: Record<string, CapabilityHandler>;
  authorize: (step: WorkflowStep, workflow: WorkflowDefinition) => PolicyDecision;
  now?: () => number;
  makeIdempotencyKey?: (workflowId: string, stepId: string) => string;
};

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/;
const CAPABILITY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const MAX_TIMEOUT_MS = 60_000;
const MAX_RETRIES_PER_STEP = 3;

function validateDefinition(workflow: WorkflowDefinition): string | null {
  if (!ID_PATTERN.test(workflow.id)) return "Invalid workflow ID.";
  if (!Number.isInteger(workflow.version) || workflow.version < 1) return "Workflow version must be a positive integer.";
  if (!Array.isArray(workflow.steps) || workflow.steps.length < 1) return "Workflow must contain at least one step.";
  if (workflow.steps.length > workflow.limits.maxSteps) return "Workflow exceeds its declared step limit.";
  if (!Number.isInteger(workflow.limits.maxSteps) || workflow.limits.maxSteps < 1 || workflow.limits.maxSteps > 100) return "maxSteps must be between 1 and 100.";
  if (!Number.isInteger(workflow.limits.maxDurationMs) || workflow.limits.maxDurationMs < 1 || workflow.limits.maxDurationMs > 300_000) return "maxDurationMs must be between 1 and 300000.";
  if (!Number.isInteger(workflow.limits.maxRetries) || workflow.limits.maxRetries < 0 || workflow.limits.maxRetries > 10) return "maxRetries must be between 0 and 10.";

  const seen = new Set<string>();
  for (const step of workflow.steps) {
    if (!ID_PATTERN.test(step.id) || seen.has(step.id)) return "Step IDs must be valid and unique.";
    seen.add(step.id);
    if (!CAPABILITY_PATTERN.test(step.capability)) return `Invalid capability name in step ${step.id}.`;
    if (!["read", "write", "delete", "external"].includes(step.kind)) return `Invalid action kind in step ${step.id}.`;
    if (!["low", "moderate", "high", "critical"].includes(step.risk)) return `Invalid risk level in step ${step.id}.`;
    if (!step.input || typeof step.input !== "object" || Array.isArray(step.input)) return `Step ${step.id} input must be an object.`;
    if (step.timeoutMs !== undefined && (!Number.isInteger(step.timeoutMs) || step.timeoutMs < 1 || step.timeoutMs > MAX_TIMEOUT_MS)) return `Step ${step.id} timeout is outside the allowed range.`;
    if (step.retries !== undefined && (!Number.isInteger(step.retries) || step.retries < 0 || step.retries > MAX_RETRIES_PER_STEP)) return `Step ${step.id} retry count is outside the allowed range.`;
  }
  return null;
}

/**
 * Executes a validated workflow sequentially through explicitly registered capability
 * handlers. It does not dynamically execute model-generated code or grant permissions.
 * Durable persistence, distributed locking, and external credential storage belong to
 * the host runtime and are intentionally not simulated here.
 */
export async function executeWorkflow(
  workflow: WorkflowDefinition,
  options: WorkflowRuntimeOptions,
): Promise<WorkflowRunResult> {
  const events: RuntimeEvent[] = [];
  const outputs: Record<string, unknown> = {};
  const now = options.now ?? Date.now;
  const startedAt = now();

  const emit = (type: string, stepId?: string, detail: Record<string, unknown> = {}) => {
    events.push({
      at: new Date(now()).toISOString(),
      type,
      workflowId: workflow.id,
      ...(stepId ? { stepId } : {}),
      detail,
    });
  };

  const invalid = validateDefinition(workflow);
  if (invalid) {
    emit("workflow.rejected", undefined, { reason: invalid });
    return { workflowId: workflow.id, status: "blocked", outputs, events, error: invalid };
  }

  emit("workflow.started", undefined, { version: workflow.version, stepCount: workflow.steps.length });

  for (const step of workflow.steps) {
    if (now() - startedAt >= workflow.limits.maxDurationMs) {
      const error = "Workflow time budget exhausted.";
      emit("workflow.blocked", step.id, { reason: error });
      return { workflowId: workflow.id, status: "blocked", outputs, events, error };
    }

    const decision = options.authorize(step, workflow);
    if (!decision.allowed) {
      emit("step.blocked", step.id, { reason: decision.reason, capability: step.capability });
      return { workflowId: workflow.id, status: "blocked", outputs, events, error: decision.reason };
    }

    if (step.kind === "delete" || step.risk === "high" || step.risk === "critical") {
      const error = "This runtime slice permits unattended execution only for non-destructive, low/moderate-risk steps approved by policy.";
      emit("step.blocked", step.id, { reason: error, kind: step.kind, risk: step.risk });
      return { workflowId: workflow.id, status: "blocked", outputs, events, error };
    }

    const handler = options.handlers[step.capability];
    if (!handler) {
      const error = `Capability handler is not registered: ${step.capability}`;
      emit("step.failed", step.id, { reason: error });
      return { workflowId: workflow.id, status: "failed", outputs, events, error };
    }

    const configuredRetries = step.retries ?? 0;
    const retries = step.retrySafe ? Math.min(configuredRetries, workflow.limits.maxRetries) : 0;
    let succeeded = false;
    let lastError = "Step failed.";
    const idempotencyKey = (options.makeIdempotencyKey ?? ((workflowId, stepId) => `${workflowId}:${workflowId.length}:${stepId}`))(workflow.id, step.id);

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      if (now() - startedAt >= workflow.limits.maxDurationMs) {
        lastError = "Workflow time budget exhausted.";
        break;
      }

      const controller = new AbortController();
      const timeoutMs = step.timeoutMs ?? 10_000;
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      emit("step.started", step.id, { attempt: attempt + 1, capability: step.capability, idempotencyKey });

      try {
        const timeout = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            controller.abort();
            reject(new Error("Step timed out."));
          }, timeoutMs);
        });
        const result = await Promise.race([
          handler(step.input, { workflowId: workflow.id, stepId: step.id, idempotencyKey, signal: controller.signal }),
          timeout,
        ]);
        if (!result || result.verified !== true) {
          throw new Error("Postcondition verification did not pass.");
        }
        outputs[step.id] = result.output;
        emit("step.verified", step.id, { attempt: attempt + 1, evidence: result.evidence ?? [] });
        succeeded = true;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown step error.";
        emit("step.attempt_failed", step.id, { attempt: attempt + 1, reason: lastError });
      } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
      }
    }

    if (!succeeded) {
      emit("workflow.failed", step.id, { reason: lastError });
      return { workflowId: workflow.id, status: "failed", outputs, events, error: lastError };
    }
  }

  emit("workflow.completed", undefined, { verifiedSteps: Object.keys(outputs).length });
  return { workflowId: workflow.id, status: "completed", outputs, events };
}
