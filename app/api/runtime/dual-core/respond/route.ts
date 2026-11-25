import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidBridgeToken } from "@/lib/bridge-auth";
import { runDualCoreTurn } from "@/lib/runtime/dual-core.mjs";
import { createOpenAIProvider } from "@/lib/runtime/openai.mjs";
import { createClaudeProvider } from "@/lib/runtime/claude.mjs";
import { createDecisionProvider } from "@/lib/runtime/decision-provider.mjs";

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

  if (!process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Both COSMOS Core and Alien Mind providers must be configured." }, { status: 503 });
  }

  try {
    const coreProvider = createDecisionProvider(createOpenAIProvider(), "cosmos-core");
    const alienProvider = createDecisionProvider(createClaudeProvider(), "alien-mind");
    const result = await runDualCoreTurn({
      prompt: parsed.data.prompt,
      coreProvider,
      alienProvider
    });
    return NextResponse.json(result, { status: result.status === "aligned" ? 200 : 202 });
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined;
    if (code === "PROVIDER_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Both model providers must be configured." }, { status: 503 });
    }
    if (code === "PROVIDER_REQUEST_FAILED") {
      return NextResponse.json({ error: "One or both model providers failed." }, { status: 502 });
    }
    if (code === "INVALID_DECISION_FORMAT") {
      return NextResponse.json({ error: "A model did not return a valid decision. Human review is required." }, { status: 202 });
    }
    return NextResponse.json({ error: "COSMOS dual-core runtime could not complete the request." }, { status: 502 });
  }
}
