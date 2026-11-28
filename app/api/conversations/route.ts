import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApiRequest } from "@/lib/cosmos/api-auth";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 24 * 1024;

const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  message: z.string().trim().min(1).max(20000),
});

type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 };

async function readBoundedJson(request: Request): Promise<BoundedJsonResult> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return { ok: false, status: 413 };
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400 };

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, status: 400 };
  }
}

function authenticationError(reason: string, status: 401 | 503) {
  const message = status === 503
    ? "Authentication is not configured. Conversation access is temporarily unavailable."
    : "A valid authenticated session is required.";
  return NextResponse.json({ error: { code: reason, message } }, { status });
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return authenticationError(auth.reason, auth.status);

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT c.id, c.title, c.created_at, c.updated_at,
        (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id) AS message_count
      FROM conversations c
      WHERE c.tenant_id = ${auth.principal.tenantId}
        AND c.owner_subject = ${auth.principal.subject}
      ORDER BY c.updated_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ conversations: rows });
  } catch {
    return NextResponse.json(
      { error: "Could not load conversations." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return authenticationError(auth.reason, auth.status);

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const body = await readBoundedJson(request);
  if (!body.ok) {
    return NextResponse.json(
      { error: body.status === 413 ? "Request body is too large." : "Request body must be valid JSON." },
      { status: body.status },
    );
  }

  const parsed = createConversationSchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide a message between 1 and 20,000 characters." },
      { status: 400 },
    );
  }

  try {
    const sql = getSql();
    const title = parsed.data.title ?? parsed.data.message.slice(0, 72);

    // One SQL statement keeps the conversation and its first message atomic.
    const rows = await sql`
      WITH created_conversation AS (
        INSERT INTO conversations (title, tenant_id, owner_subject)
        VALUES (${title}, ${auth.principal.tenantId}, ${auth.principal.subject})
        RETURNING id, title, created_at, updated_at
      ),
      created_message AS (
        INSERT INTO messages (conversation_id, role, content)
        SELECT id, 'user', ${parsed.data.message}
        FROM created_conversation
        RETURNING conversation_id
      )
      SELECT c.id, c.title, c.created_at, c.updated_at
      FROM created_conversation c
      INNER JOIN created_message m ON m.conversation_id = c.id
    `;

    const conversation = rows[0];
    if (!conversation) throw new Error("Atomic conversation insert returned no row.");

    return NextResponse.json({ conversation, stored: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not save the conversation." },
      { status: 503 },
    );
  }
}
