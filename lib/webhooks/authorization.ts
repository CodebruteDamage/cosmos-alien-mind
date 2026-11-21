export type WebhookRiskClass = "low" | "moderate" | "high" | "critical";

export interface VerifiedWebhookIntegration {
  /** Set only by a trusted credential registry after signature verification. */
  integrationId: string;
  tenantId: string;
  allowedEventTypes: readonly string[];
  allowedOperations: readonly string[];
  allowedTargetScopes: readonly string[];
  approvalRequiredFor: readonly WebhookRiskClass[];
}

export interface WebhookAuthorizationRequest {
  eventType: string;
  operation: string;
  targetScope: string;
  riskClass: WebhookRiskClass;
}

export interface TrustedApprovalDecision {
  approved: boolean;
  approvalReference?: string;
}

export type WebhookAuthorizationFailure =
  | "integration_identity_missing"
  | "tenant_identity_missing"
  | "event_type_not_allowed"
  | "operation_not_allowed"
  | "target_scope_not_allowed"
  | "human_approval_required"
  | "approval_reference_missing";

export type WebhookAuthorizationResult =
  | {
      allowed: true;
      integrationId: string;
      tenantId: string;
      approvalReference?: string;
    }
  | {
      allowed: false;
      reason: WebhookAuthorizationFailure;
    };

/**
 * Pure, deny-by-default policy evaluation for a future WARP GATE adapter.
 *
 * The integration identity and tenant mapping must come from a trusted
 * credential registry, never from the webhook body or its "source" field.
 * Approval decisions must come from a trusted human-approval service.
 * This function does not execute operations or establish either trust source.
 */
export function authorizeWebhookEvent(
  integration: VerifiedWebhookIntegration | null,
  request: WebhookAuthorizationRequest,
  approval: TrustedApprovalDecision | null = null,
): WebhookAuthorizationResult {
  if (!integration?.integrationId?.trim()) {
    return { allowed: false, reason: "integration_identity_missing" };
  }
  if (!integration.tenantId?.trim()) {
    return { allowed: false, reason: "tenant_identity_missing" };
  }
  if (!integration.allowedEventTypes.includes(request.eventType)) {
    return { allowed: false, reason: "event_type_not_allowed" };
  }
  if (!integration.allowedOperations.includes(request.operation)) {
    return { allowed: false, reason: "operation_not_allowed" };
  }
  if (!integration.allowedTargetScopes.includes(request.targetScope)) {
    return { allowed: false, reason: "target_scope_not_allowed" };
  }

  if (integration.approvalRequiredFor.includes(request.riskClass)) {
    if (!approval?.approved) {
      return { allowed: false, reason: "human_approval_required" };
    }
    if (!approval.approvalReference?.trim()) {
      return { allowed: false, reason: "approval_reference_missing" };
    }
  }

  return {
    allowed: true,
    integrationId: integration.integrationId,
    tenantId: integration.tenantId,
    ...(approval?.approvalReference ? { approvalReference: approval.approvalReference } : {}),
  };
}
