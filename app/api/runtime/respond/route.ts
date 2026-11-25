import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidBridgeToken } from "@/lib/bridge-auth";
import { runAssistantTurn } from "@/lib/runtime/core.mjs";
import { createOpenAIProvider } from "@/lib/runtime/openai.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(20000)
}).strict();

export async function POST(request: NextRequest) {
  if (!isValidBridgeToken(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await request.text();
  if (raw.length > 24000) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a prompt between 1 and 20,000 characters." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "GPT provider is not configured." }, { status: 503 });
  }

  try {
    const provider = createOpenAIProvider();
    const result = await runAssistantTurn({ prompt: parsed.data.prompt, provider });
    return NextResponse.json(result);
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined;
    if (code === "PROVIDER_NOT_CONFIGURED") {
      return NextResponse.json({ error: "GPT provider is not configured." }, { status: 503 });
    }
    if (code === "PROVIDER_REQUEST_FAILED") {
      return NextResponse.json({ error: "GPT provider request failed." }, { status: 502 });
    }
    return NextResponse.json({ error: "COSMOS runtime could not complete the request." }, { status: 502 });
  }
}
