import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authorizeWebhookEvent } from "@/lib/webhooks/authorization";
import { verifyWebhookSignature } from "@/lib/webhooks/security";
import { getWebhookIntegration } from "@/lib/webhooks/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024;
const POLICY_VERSION = "webhook-policy-v1";
const eventSchema = z.object({
  event_id: z.string().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/),
  event_type: z.string().min(1).max(128).regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/),
  occurred_at: z.string().datetime({ offset: true }),
  source: z.string().trim().min(1).max(100),
  payload: z.record(z.string(), z.unknown()),
}).strict();

async function readLimitedBody(request: NextRequest): Promise<Buffer | null> {
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, totalBytes);
}

export async function POST(request: NextRequest) {
  if (process.env.COSMOS_WEBHOOK_ENABLED !== "true") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Unsupported media type." }, { status: 415 });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0 || declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }
  }

  const keyId = request.headers.get("x-cosmos-key-id");
  if (!keyId || !/^[A-Za-z0-9_-]{1,64}$/.test(keyId)) {
    return NextResponse.json({ error: "Invalid webhook authentication." }, { status: 401 });
  }

  const rawBody = await readLimitedBody(request);
  if (rawBody === null) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  try {
    const sql = getSql();
    const integration = await getWebhookIntegration(sql, keyId);
    if (!integration || !integration.enabled) {
      return NextResponse.json({ error: "Invalid webhook authentication." }, { status: 401 });
    }

    const secret = process.env[integration.secretEnvVar];
    if (!verifyWebhookSignature(
      rawBody,
      request.headers.get("x-cosmos-timestamp"),
      request.headers.get("x-cosmos-signature"),
      secret ?? "",
    )) {
      return NextResponse.json({ error: "Invalid webhook authentication." }, { status: 401 });
    }

    let untrustedPayload: unknown;
    try {
      untrustedPayload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const parsed = eventSchema.safeParse(untrustedPayload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event envelope." }, { status: 400 });
    }

    const event = parsed.data;
    const eventPolicy = integration.eventPolicies[event.event_type];
    const authorization = eventPolicy && integration.allowedEventTypes.includes(event.event_type)
      ? authorizeWebhookEvent(integration, {
          eventType: event.event_type,
          operation: eventPolicy.operation,
          targetScope: eventPolicy.targetScope,
          riskClass: eventPolicy.riskClass,
        })
      : { allowed: false as const, reason: "event_type_not_allowed" as const };

    await sql`
      INSERT INTO cosmos_webhook_authorization_audit
        (event_id, integration_id, tenant_id, event_type, decision, reason_code, policy_version)
      VALUES (
        ${event.event_id},
        ${integration.integrationId},
        ${integration.tenantId},
        ${event.event_type},
        ${authorization.allowed ? "allow" : "deny"},
        ${authorization.allowed ? "allowed" : authorization.reason},
        ${POLICY_VERSION}
      )
      ON CONFLICT (integration_id, event_id, decision) DO NOTHING
    `;

    if (!authorization.allowed) {
      return NextResponse.json({ error: "Event is not authorized by policy." }, { status: 403 });
    }

    const inserted = await sql`
      INSERT INTO cosmos_webhook_inbox
        (event_id, integration_id, tenant_id, source, event_type, occurred_at, payload, status)
      VALUES (
        ${event.event_id},
        ${integration.integrationId},
        ${integration.tenantId},
        ${event.source},
        ${event.event_type},
        ${event.occurred_at},
        ${JSON.stringify(event.payload)}::jsonb,
        'received'
      )
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id
    `;

    if (inserted.length === 0) {
      return NextResponse.json({ accepted: true, duplicate: true }, { status: 200 });
    }
    // An allow decision authorizes receipt under policy only; no operation executes here.
    return NextResponse.json(
      { accepted: true, duplicate: false, status: "received" },
      { status: 202 },
    );
  } catch {
    // Registry, audit, or database errors fail closed.
    return NextResponse.json({ error: "Webhook service is unavailable." }, { status: 503 });
  }
}
