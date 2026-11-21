import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/webhooks/security";
import { getWebhookIntegration } from "@/lib/webhooks/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024;
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
    const validSignature = verifyWebhookSignature(
      rawBody,
      request.headers.get("x-cosmos-timestamp"),
      request.headers.get("x-cosmos-signature"),
      secret ?? "",
    );
    if (!validSignature) {
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
    if (!integration.allowedEventTypes.includes(parsed.data.event_type)) {
      return NextResponse.json({ error: "Event type is not authorized." }, { status: 403 });
    }

    const inserted = await sql`
      INSERT INTO cosmos_webhook_inbox
        (event_id, integration_id, tenant_id, source, event_type, occurred_at, payload, status)
      VALUES (
        ${parsed.data.event_id},
        ${integration.integrationId},
        ${integration.tenantId},
        ${parsed.data.source},
        ${parsed.data.event_type},
        ${parsed.data.occurred_at},
        ${JSON.stringify(parsed.data.payload)}::jsonb,
        'received'
      )
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id
    `;

    if (inserted.length === 0) {
      return NextResponse.json({ accepted: true, duplicate: true }, { status: 200 });
    }
    return NextResponse.json(
      { accepted: true, duplicate: false, status: "received" },
      { status: 202 },
    );
  } catch {
    // Registry/database errors fail closed; never acknowledge unpersisted events.
    return NextResponse.json({ error: "Webhook service is unavailable." }, { status: 503 });
  }
}
