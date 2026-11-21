import type { getSql } from "@/lib/db";

export interface ClaimedWebhookEvent {
  event_id: string;
  integration_id: string;
  tenant_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  attempts: number;
}

const MAX_RETRY_DELAY_SECONDS = 60 * 60;

export function webhookRetryDelaySeconds(attempt: number): number {
  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new Error("attempt must be a positive integer");
  }
  return Math.min(30 * 2 ** Math.min(attempt - 1, 20), MAX_RETRY_DELAY_SECONDS);
}

/**
 * Atomically leases a bounded batch. SKIP LOCKED prevents concurrent workers
 * from claiming the same row. This function does not authorize or execute events.
 */
export async function claimWebhookBatch(
  sql: ReturnType<typeof getSql>,
  limit = 10,
  leaseSeconds = 60,
  maxAttempts = 5,
): Promise<ClaimedWebhookEvent[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("invalid batch limit");
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 10 || leaseSeconds > 900) {
    throw new Error("invalid lease duration");
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) {
    throw new Error("invalid maximum attempts");
  }

  const rows = await sql`
    WITH candidates AS (
      SELECT event_id
      FROM cosmos_webhook_inbox
      WHERE attempts < ${maxAttempts}
        AND (
          (status IN ('received', 'failed') AND available_at <= NOW())
          OR (status = 'processing' AND lease_until < NOW())
        )
      ORDER BY received_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE cosmos_webhook_inbox AS inbox
    SET status = 'processing',
        attempts = inbox.attempts + 1,
        lease_until = NOW() + make_interval(secs => ${leaseSeconds})
    FROM candidates
    WHERE inbox.event_id = candidates.event_id
    RETURNING inbox.event_id, inbox.integration_id, inbox.tenant_id,
              inbox.event_type, inbox.payload, inbox.attempts
  `;
  return rows as unknown as ClaimedWebhookEvent[];
}

/** Record a bounded retry without storing untrusted error text or secrets. */
export async function scheduleWebhookRetry(
  sql: ReturnType<typeof getSql>,
  eventId: string,
  attempt: number,
  errorCode: string,
  maxAttempts = 5,
): Promise<void> {
  if (!/^[a-z0-9_]{1,64}$/.test(errorCode)) throw new Error("invalid error code");
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > maxAttempts) {
    throw new Error("invalid attempt");
  }
  const exhausted = attempt >= maxAttempts;
  const delay = webhookRetryDelaySeconds(attempt);
  await sql`
    UPDATE cosmos_webhook_inbox
    SET status = ${exhausted ? "dead_letter" : "failed"},
        available_at = NOW() + make_interval(secs => ${delay}),
        lease_until = NULL,
        last_error_code = ${errorCode}
    WHERE event_id = ${eventId}
      AND status = 'processing'
      AND attempts = ${attempt}
  `;
}
