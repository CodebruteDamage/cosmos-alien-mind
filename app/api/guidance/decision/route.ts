import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { decideGuidance } from "@/lib/guidance-decision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  objective: z.string().trim().min(1).max(4000),
  objectiveSatisfied: z.boolean(),
  guidance: z.object({
    recommendation: z.string().trim().min(1).max(8000),
    scopeIncluded: z.boolean(),
    buildRequired: z.boolean(),
    policyDenied: z.boolean().optional(),
  }),
  evidence: z.object({
    sufficient: z.boolean(),
    refs: z.array(z.string().trim().min(1).max(2000)).max(100),
    confidence: z.number().min(0).max(1),
  }),
  blockers: z.array(z.object({
    id: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(2000),
    verified: z.boolean(),
  })).max(100),
  riskClass: z.enum(["R0", "R1", "R2", "R3"]),
  dependenciesSatisfied: z.boolean(),
  approvalValid: z.boolean(),
  stopRequested: z.boolean(),
});

export async function GET() {
  return NextResponse.json({
    engine: "COSMOS Guidance Decision Engine",
    version: "1.0.0",
    mode: "decision_only",
    executesActions: false,
    decisions: ["PROCEED", "GATHER_EVIDENCE", "INVOKE_CRAFT", "REQUIRE_APPROVAL", "DEFER", "DENY", "STOP", "NO_ACTION"],
    note: "A decision is not an execution grant. WARP GATE and the authorized orchestrator must independently enforce permissions.",
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
    return NextResponse.json({
      error: "Invalid guidance decision input.",
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    }, { status: 400 });
  }

  try {
    const decision = decideGuidance(parsed.data);
    return NextResponse.json({
      engine: "COSMOS Guidance Decision Engine",
      version: "1.0.0",
      mode: "decision_only",
      ...decision,
    });
  } catch {
    return NextResponse.json({ error: "Guidance decision validation failed." }, { status: 400 });
  }
}
