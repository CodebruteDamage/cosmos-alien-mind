import type { NeonQueryFunction } from "@neondatabase/serverless";

export interface WebhookIntegrationRecord {
  integrationId: string;
  tenantId: string;
  secretEnvVar: string;
  allowedEventTypes: string[];
  enabled: boolean;
}

const SECRET_ENV_VAR_PATTERN = /^COSMOS_WEBHOOK_SECRET_[A-Z0-9_]{1,64}$/;

export function isValidSecretEnvVar(value: string): boolean {
  return SECRET_ENV_VAR_PATTERN.test(value);
}

/**
 * Resolve provider identity and tenant mapping from the server-controlled registry.
 * Neither identity nor secret references are accepted from the webhook body.
 */
export async function getWebhookIntegration(
  sql: NeonQueryFunction<false, false>,
  keyId: string,
): Promise<WebhookIntegrationRecord | null> {
  const rows = await sql`
    SELECT integration_id, tenant_id, secret_env_var, allowed_event_types, enabled
    FROM cosmos_webhook_integrations
    WHERE key_id = ${keyId}
    LIMIT 1
  `;
  const row = rows[0] as {
    integration_id: string;
    tenant_id: string;
    secret_env_var: string;
    allowed_event_types: string[];
    enabled: boolean;
  } | undefined;
  if (!row || !isValidSecretEnvVar(row.secret_env_var)) return null;
  if (!Array.isArray(row.allowed_event_types) || !row.allowed_event_types.every((v) => typeof v === "string")) {
    return null;
  }
  return {
    integrationId: row.integration_id,
    tenantId: row.tenant_id,
    secretEnvVar: row.secret_env_var,
    allowedEventTypes: row.allowed_event_types,
    enabled: row.enabled === true,
  };
}
