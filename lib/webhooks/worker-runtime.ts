import type { getSql } from "@/lib/db";
import {
  claimWebhookBatch,
  markWebhookProcessed,
  quarantineWebhookEvent,
  scheduleWebhookRetry,
  type ClaimedWebhookEvent,
} from "@/lib/webhooks/queue";
import type { TrustedApprovalDecision, WebhookAuthorizationResult } from "@/lib/webhooks/authorization";
import { getWebhookIntegrationById } from "@/lib/webhooks/registry";
import {
  dispatchClaimedWebhookBatch,
  type WebhookWorkerResult,
} from "@/lib/webhooks/worker";

export type WebhookOperationHandler = (
  event: ClaimedWebhookEvent,
  authorization: Extract<WebhookAuthorizationResult, { allowed: true }>,
  idempotencyKey: string,
) => Promise<void>;

export type WebhookOperationHandlers = Readonly<Record<string, WebhookOperationHandler>>;

export interface WebhookWorkerRuntimeOptions {
  batchSize?: number;
  leaseSeconds?: number;
  maxAttempts?: number;
  resolveApproval?: (
    event: ClaimedWebhookEvent,
    operation: string,
    targetScope: string,
  ) => Promise<TrustedApprovalDecision | null>;
}

/**
 * Runs one bounded worker batch. This is deliberately not scheduled or exposed
 * as an HTTP route. Callers must supply an explicit operation-handler registry.
 * No registered handler or approval adapter means no privileged operation runs.
 */
export async function runWebhookWorkerBatch(
  sql: ReturnType<typeof getSql>,
  handlers: WebhookOperationHandlers,
  options: WebhookWorkerRuntimeOptions = {},
): Promise<WebhookWorkerResult[]> {
  const events = await claimWebhookBatch(
    sql,
    options.batchSize ?? 10,
    options.leaseSeconds ?? 60,
    options.maxAttempts ?? 5,
  );

  return dispatchClaimedWebhookBatch(events, {
    loadIntegration: (integrationId) => getWebhookIntegrationById(sql, integrationId),
    resolveApproval: options.resolveApproval
      ? (event, policy) => options.resolveApproval!(event, policy.operation, policy.targetScope)
      : undefined,
    recordDecision: async (decision) => {
      await sql`
        INSERT INTO cosmos_webhook_authorization_audit
          (event_id, integration_id, tenant_id, event_type, decision_stage,
           decision, reason_code, approval_reference, policy_version)
        VALUES (
          ${decision.eventId},
          ${decision.integrationId},
          ${decision.tenantId},
          ${decision.eventType},
          'dispatch',
          ${decision.decision},
          ${decision.reasonCode},
          ${decision.approvalReference ?? null},
          'webhook-policy-v1'
        )
      `;
    },
    isOperationRegistered: (operation) => typeof handlers[operation] === "function",
    execute: async (event, policy, authorization, idempotencyKey) => {
      const handler = handlers[policy.operation];
      if (!handler) throw new Error("No registered handler");
      await handler(event, authorization, idempotencyKey);
    },
    markProcessed: (eventId, attempt) => markWebhookProcessed(sql, eventId, attempt),
    quarantine: (eventId, attempt, reasonCode) =>
      quarantineWebhookEvent(sql, eventId, attempt, reasonCode),
    scheduleRetry: (eventId, attempt, errorCode) =>
      scheduleWebhookRetry(sql, eventId, attempt, errorCode, options.maxAttempts ?? 5),
  });
}
