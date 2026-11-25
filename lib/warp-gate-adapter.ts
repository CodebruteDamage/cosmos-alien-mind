import type { PolicyDecision, WorkflowDefinition, WorkflowStep } from "./workflow-runtime.ts";

export type WarpGateAllow = {
  decision: "ALLOW";
  executionGrant: string;
  reason?: string;
};
export type WarpGateNonAllow = {
  decision: "DENY" | "REQUIRE_APPROVAL" | "BLOCKED";
  reason: string;
};
export type WarpGateAuthorization = WarpGateAllow | WarpGateNonAllow;

export type GrantBinding = {
  workflowId: string;
  stepId: string;
  capability: string;
  action: WorkflowStep["kind"];
  risk: WorkflowStep["risk"];
};

export type WarpGatePort = {
  authorize(input: {
    workflow: WorkflowDefinition;
    step: WorkflowStep;
    binding: GrantBinding;
  }): Promise<WarpGateAuthorization>;
  verifyAndConsume(input: {
    executionGrant: string;
    expected: GrantBinding;
  }): Promise<{ valid: boolean; reason: string }>;
};

/**
 * Bridges the workflow executor to WARP GATE without importing or duplicating
 * WARP GATE policy. The host supplies the real WARP GATE authorization and
 * executor-side grant-verification adapters. A bare ALLOW is never sufficient.
 */
export function createWarpGateAuthorizer(gate: WarpGatePort) {
  return async (step: WorkflowStep, workflow: WorkflowDefinition): Promise<PolicyDecision> => {
    const expected: GrantBinding = {
      workflowId: workflow.id,
      stepId: step.id,
      capability: step.capability,
      action: step.kind,
      risk: step.risk,
    };

    try {
      const authorization = await gate.authorize({ workflow, step, binding: expected });
      if (authorization.decision !== "ALLOW") {
        return { allowed: false, reason: authorization.reason };
      }
      if (typeof authorization.executionGrant !== "string" || authorization.executionGrant.length < 1) {
        return { allowed: false, reason: "WARP GATE returned ALLOW without an execution grant." };
      }

      const verification = await gate.verifyAndConsume({
        executionGrant: authorization.executionGrant,
        expected,
      });
      if (!verification.valid) {
        return { allowed: false, reason: verification.reason || "Execution grant verification failed." };
      }
      return { allowed: true, reason: "WARP GATE grant verified and consumed." };
    } catch {
      return { allowed: false, reason: "WARP GATE authorization or grant verification failed; execution blocked." };
    }
  };
}
