import type { getSql } from "@/lib/db";
import type { WebhookRiskClass } from "@/lib/webhooks/authorization";

export interface EventPolicy {
  operation: string;
  targetScope: string;
  riskClass: WebhookRiskClass;
}

export interface WebhookIntegrationRecord {
  integrationId: string;
  tenantId: string;
  secretEnvVar: string;
  allowedEventTypes: string[];
  allowedOperations: string[];
  allowedTargetScopes: string[];
  approvalRequiredFor: WebhookRiskClass[];
  eventPolicies: Record<string, EventPolicy>;
  enabled: boolean;
}

const SECRET_ENV_VAR_PATTERN = /^COSMOS_WEBHOOK_SECRET_[A-Z0-9_]{1,64}$/;
const EVENT_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const OPERATION_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;
const RISK_CLASSES: WebhookRiskClass[] = ["low", "moderate", "high", "critical"];

export function isValidSecretEnvVar(value: string): boolean {
  return SECRET_ENV_VAR_PATTERN.test(value);
}

export function parseEventPolicies(
  value: unknown,
  tenantId: string,
): Record<string, EventPolicy> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const policies: Record<string, EventPolicy> = {};
  for (const [eventType, raw] of Object.entries(value)) {
    if (!EVENT_PATTERN.test(eventType) || !raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const item = raw as Record<string, unknown>;
    if (typeof item.operation !== "string" || !OPERATION_PATTERN.test(item.operation)) return null;
    if (typeof item.targetScope !== "string" ||
        !item.targetScope.startsWith(`tenant:${tenantId}/`) ||
        item.targetScope.length > 200) return null;
    if (typeof item.riskClass !== "string" ||
        !RISK_CLASSES.includes(item.riskClass as WebhookRiskClass)) return null;
    policies[eventType] = {
      operation: item.operation,
      targetScope: item.targetScope,
      riskClass: item.riskClass as WebhookRiskClass,
    };
  }
  return policies;
}

/** Resolve identity and policy only from the server-controlled registry. */
export async function getWebhookIntegration(
  sql: ReturnType<typeof getSql>,
  keyId: string,
): Promise<WebhookIntegrationRecord | null> {
  const rows = await sql`
    SELECT integration_id, tenant_id, secret_env_var, allowed_event_types,
           event_policies, enabled
    FROM cosmos_webhook_integrations
    WHERE key_id = ${keyId}
    LIMIT 1
  `;
  const row = rows[0] as {
    integration_id: string;
    tenant_id: string;
    secret_env_var: string;
    allowed_event_types: string[];
    event_policies: unknown;
    enabled: boolean;
  } | undefined;
  if (!row || !isValidSecretEnvVar(row.secret_env_var)) return null;
  if (!Array.isArray(row.allowed_event_types) ||
      !row.allowed_event_types.every((v) => typeof v === "string")) return null;
  const eventPolicies = parseEventPolicies(row.event_policies, row.tenant_id);
  if (!eventPolicies) return null;
  const allowedEventTypes = row.allowed_event_types.filter((type) => Boolean(eventPolicies[type]));
  const values = Object.values(eventPolicies);
  return {
    integrationId: row.integration_id,
    tenantId: row.tenant_id,
    secretEnvVar: row.secret_env_var,
    allowedEventTypes,
    allowedOperations: [...new Set(values.map((policy) => policy.operation))],
    allowedTargetScopes: [...new Set(values.map((policy) => policy.targetScope))],
    approvalRequiredFor: [...new Set(values
      .filter((policy) => policy.riskClass === "high" || policy.riskClass === "critical")
      .map((policy) => policy.riskClass))],
    eventPolicies,
    enabled: row.enabled === true,
  };
}
