import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PROMPT_COMMANDS, recommendPromptCommand } from "@/lib/prompt-commands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(20000),
});

export async function GET() {
  return NextResponse.json({
    framework: "COSMOS Prompt Intelligence Framework",
    version: "1.0.0",
    mode: "recommendation_only",
    commands: PROMPT_COMMANDS,
  });
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a prompt between 1 and 20,000 characters." }, { status: 400 });
  }

  const recommendation = recommendPromptCommand(parsed.data.prompt);
  if (recommendation.status === "unknown_command") {
    return NextResponse.json({
      ...recommendation,
      error: "Unknown command. Retrieve GET /api/commands for the supported command registry.",
    }, { status: 400 });
  }

  return NextResponse.json({
    framework: "COSMOS Prompt Intelligence Framework",
    version: "1.0.0",
    mode: "recommendation_only",
    executionStarted: false,
    governance: {
      approvalRequiredBeforeSideEffects: true,
      policy: "Recommendations do not grant permissions or execute tools. Runtime authorization and WARP GATE checks remain mandatory.",
    },
    ...recommendation,
  });
}
