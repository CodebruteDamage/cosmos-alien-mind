import {
  authorizeWebhookEvent,
  type TrustedApprovalDecision,
  type WebhookAuthorizationResult,
} from "@/lib/webhooks/authorization";
import type { ClaimedWebhookEvent } from "@/lib/webhooks/queue";
import type { WebhookIntegrationRecord } from "@/lib/webhooks/registry";

export interface WorkerAuditDecision {
  eventId: string;
  integrationId: string;
  tenantId: string;
  eventType: string;
  decision: "allow" | "deny";
  reasonCode: string;
  approvalReference?: string;
}

export interface WebhookWorkerDependencies {
  /** Always resolve current registry policy; never trust a policy snapshot in the event. */
  loadIntegration(integrationId: string): Promise<WebhookIntegrationRecord | null>;
  /** Must return a verifiable decision from the trusted approval service. */
  resolveApproval?(
    event: ClaimedWebhookEvent,
    policy: WebhookIntegrationRecord["eventPolicies"][string],
  ): Promise<TrustedApprovalDecision | null>;
  /** Must append an audit record and reject on persistence failure. */
  recordDecision(decision: WorkerAuditDecision): Promise<void>;
  /** Must dispatch only an explicitly registered operation handler and be idempotent by key. */
  execute(
    event: ClaimedWebhookEvent,
    authorization: Extract<WebhookAuthorizationResult, { allowed: true }>,
    idempotencyKey: string,
  ): Promise<void>;
  markProcessed(eventId: string, attempt: number): Promise<boolean>;
  quarantine(eventId: string, attempt: number, reasonCode: string): Promise<boolean>;
  scheduleRetry(eventId: string, attempt: number, errorCode: string): Promise<void>;
}

export type WebhookWorkerResult =
  | { eventId: string; status: "processed" }
  | { eventId: string; status: "denied"; reason: string }
  | { eventId: string; status: "retry_scheduled"; reason: string }
  | { eventId: string; status: "lease_lost" };

/**
 * Re-evaluates current identity, tenant, event, operation, scope, risk, and approval
 * immediately before dispatch. No event payload field grants authority.
 */
export async function processClaimedWebhookEvent(
  event: ClaimedWebhookEvent,
  dependencies: WebhookWorkerDependencies,
): Promise<WebhookWorkerResult> {
  let integration: WebhookIntegrationRecord | null;
  try {
    integration = await dependencies.loadIntegration(event.integration_id);
  } catch {
    await dependencies.scheduleRetry(event.event_id, event.attempts, "registry_unavailable");
    return { eventId: event.event_id, status: "retry_scheduled", reason: "registry_unavailable" };
  }

  let denialReason: string | null = null;
  if (!integration || !integration.enabled) denialReason = "integration_unavailable";
  else if (integration.integrationId !== event.integration_id) denialReason = "integration_identity_mismatch";
  else if (integration.tenantId !== event.tenant_id) denialReason = "tenant_identity_mismatch";

  const policy = integration?.eventPolicies[event.event_type];
  if (!denialReason && (!policy || !integration?.allowedEventTypes.includes(event.event_type))) {
    denialReason = "event_policy_missing";
  }

  let approval: TrustedApprovalDecision | null = null;
  if (!denialReason && policy &&
      (policy.riskClass === "high" || policy.riskClass === "critical")) {
    try {
      approval = await dependencies.resolveApproval?.(event, policy) ?? null;
    } catch {
      approval = null;
    }
  }

  const authorization = !denialReason && integration && policy
    ? authorizeWebhookEvent(integration, {
        eventType: event.event_type,
        operation: policy.operation,
        targetScope: policy.targetScope,
        riskClass: policy.riskClass,
      }, approval)
    : { allowed: false as const, reason: denialReason ?? "event_policy_missing" };

  const reasonCode = authorization.allowed ? "allowed" : authorization.reason;
  try {
    await dependencies.recordDecision({
      eventId: event.event_id,
      integrationId: event.integration_id,
      tenantId: event.tenant_id,
      eventType: event.event_type,
      decision: authorization.allowed ? "allow" : "deny",
      reasonCode,
      ...(authorization.allowed && authorization.approvalReference
        ? { approvalReference: authorization.approvalReference }
        : {}),
    });
  } catch {
    await dependencies.scheduleRetry(event.event_id, event.attempts, "audit_unavailable");
    return { eventId: event.event_id, status: "retry_scheduled", reason: "audit_unavailable" };
  }

  if (!authorization.allowed) {
    const quarantined = await dependencies.quarantine(
      event.event_id,
      event.attempts,
      authorization.reason,
    );
    return quarantined
      ? { eventId: event.event_id, status: "denied", reason: authorization.reason }
      : { eventId: event.event_id, status: "lease_lost" };
  }

  try {
    await dependencies.execute(event, authorization, event.event_id);
  } catch {
    await dependencies.scheduleRetry(event.event_id, event.attempts, "handler_failed");
    return { eventId: event.event_id, status: "retry_scheduled", reason: "handler_failed" };
  }

  const completed = await dependencies.markProcessed(event.event_id, event.attempts);
  return completed
    ? { eventId: event.event_id, status: "processed" }
    : { eventId: event.event_id, status: "lease_lost" };
}

/** Serial bounded batch dispatcher. The caller owns the queue claim/lease operation. */
export async function dispatchClaimedWebhookBatch(
  events: readonly ClaimedWebhookEvent[],
  dependencies: WebhookWorkerDependencies,
): Promise<WebhookWorkerResult[]> {
  if (events.length > 100) throw new Error("worker batch exceeds maximum size");
  const results: WebhookWorkerResult[] = [];
  for (const event of events) {
    results.push(await processClaimedWebhookEvent(event, dependencies));
  }
  return results;
}
