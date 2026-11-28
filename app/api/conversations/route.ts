import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApiRequest } from "@/lib/cosmos/api-auth";
import { authorizeProtectedOperation } from "@/lib/cosmos/authorization";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  message: z.string().trim().min(1).max(20000),
});

const MAX_BODY_BYTES = 22_000;

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function readBoundedJson(request: Request): Promise<
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; code: string; message: string }
> {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return { ok: false, status: 400, code: "UNSUPPORTED_MEDIA_TYPE", message: "Content-Type must be application/json." };
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return { ok: false, status: 413, code: "BODY_TOO_LARGE", message: "Request body exceeds the allowed size." };
  }

  if (!request.body) {
    return { ok: false, status: 400, code: "EMPTY_BODY", message: "Request body is required." };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413, code: "BODY_TOO_LARGE", message: "Request body exceeds the allowed size." };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, code: "BODY_READ_FAILED", message: "Could not read request body." };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return { ok: false, status: 400, code: "INVALID_JSON", message: "Request body must be valid JSON." };
  }
}

async function authorize(request: NextRequest, operation: "conversation.read" | "conversation.create") {
  const authentication = await authenticateApiRequest(request);
  if (!authentication.ok) {
    return { ok: false as const, response: apiError(authentication.reason, "A valid authenticated session is required.", authentication.status) };
  }

  const decision = await authorizeProtectedOperation(authentication.principal, operation);
  if (!decision.allow) {
    const status = decision.reason === "WARP_GATE_NOT_CONFIGURED" || decision.reason === "WARP_GATE_UNAVAILABLE" ? 503 : 403;
    return { ok: false as const, response: apiError(decision.reason, "WARP GATE did not authorize this operation.", status) };
  }

  return { ok: true as const, principal: authentication.principal, decisionId: decision.decisionId };
}

export async function GET(request: NextRequest) {
  const access = await authorize(request, "conversation.read");
  if (!access.ok) return access.response;

  if (!process.env.DATABASE_URL) {
    return apiError("DATABASE_NOT_CONFIGURED", "Database is not configured.", 503);
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT c.id, c.title, c.created_at, c.updated_at,
        (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id) AS message_count
      FROM conversations c
      WHERE c.tenant_id = ${access.principal.tenantId}
        AND c.owner_subject = ${access.principal.subject}
      ORDER BY c.updated_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ conversations: rows });
  } catch {
    return apiError("CONVERSATION_READ_FAILED", "Could not load tenant-scoped conversations.", 503);
  }
}

export async function POST(request: NextRequest) {
  const access = await authorize(request, "conversation.create");
  if (!access.ok) return access.response;

  const expectedOrigin = process.env.BETTER_AUTH_URL ? new URL(process.env.BETTER_AUTH_URL).origin : null;
  const requestOrigin = request.headers.get("origin");
  if (!expectedOrigin || requestOrigin !== expectedOrigin) {
    return apiError("ORIGIN_REJECTED", "Request origin is not trusted.", 403);
  }

  if (!process.env.DATABASE_URL) {
    return apiError("DATABASE_NOT_CONFIGURED", "Database is not configured.", 503);
  }

  const body = await readBoundedJson(request);
  if (!body.ok) return apiError(body.code, body.message, body.status);

  const parsed = createConversationSchema.safeParse(body.value);
  if (!parsed.success) {
    return apiError("INVALID_CONVERSATION", "Provide a message between 1 and 20,000 characters.", 400);
  }

  try {
    const sql = getSql();
    const title = parsed.data.title ?? parsed.data.message.slice(0, 72);
    const rows = await sql`
      WITH new_conversation AS (
        INSERT INTO conversations (title, tenant_id, owner_subject)
        VALUES (${title}, ${access.principal.tenantId}, ${access.principal.subject})
        RETURNING id, title, created_at, updated_at
      ),
      new_message AS (
        INSERT INTO messages (conversation_id, role, content)
        SELECT id, 'user', ${parsed.data.message}
        FROM new_conversation
        RETURNING conversation_id
      )
      SELECT c.id, c.title, c.created_at, c.updated_at
      FROM new_conversation c
      JOIN new_message m ON m.conversation_id = c.id
    `;
    return NextResponse.json({ conversation: rows[0], stored: true }, { status: 201 });
  } catch {
    return apiError("CONVERSATION_WRITE_FAILED", "Could not save the conversation.", 503);
  }
}
