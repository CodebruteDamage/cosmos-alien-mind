import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  message: z.string().trim().min(1).max(20000),
});

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT c.id, c.title, c.created_at, c.updated_at,
        (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id) AS message_count
      FROM conversations c
      ORDER BY c.updated_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ conversations: rows });
  } catch {
    return NextResponse.json(
      { error: "Could not load conversations. Confirm the Neon schema has been applied." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = createConversationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a message between 1 and 20,000 characters." }, { status: 400 });
  }

  try {
    const sql = getSql();
    const title = parsed.data.title ?? parsed.data.message.slice(0, 72);
    const conversations = await sql`
      INSERT INTO conversations (title) VALUES (${title})
      RETURNING id, title, created_at, updated_at
    `;
    const conversation = conversations[0];
    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${conversation.id}, 'user', ${parsed.data.message})
    `;
    return NextResponse.json({ conversation, stored: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not save the conversation. Confirm the Neon schema has been applied." },
      { status: 503 },
    );
  }
}
