import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { decideGuidance } from "@/lib/guidance-decision";
import { runCraftForGuidance } from "@/lib/guidance-craft.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const assessmentSchema = z.object({
  complexity: z.number().min(0).max(5),
  risk: z.number().min(0).max(5),
  urgency: z.number().min(0).max(5),
  dependency: z.number().min(0).max(5),
  confidence: z.number().min(0).max(5),
  evidenceRefs: z.array(z.string().trim().min(1).max(2000)).min(1).max(100),
  source: z.string().trim().min(1).max(200),
  gapCycleId: z.string().trim().max(200).optional(),
  gapStageId: z.string().trim().max(200).optional(),
});

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
    assessment: assessmentSchema.optional(),
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
    mode: "decision_and_recommendation_only",
    executesActions: false,
    decisions: ["PROCEED", "GATHER_EVIDENCE", "INVOKE_CRAFT", "REQUIRE_APPROVAL", "DEFER", "DENY", "STOP", "NO_ACTION"],
    craft: "Conditional, verified-blocker-only triage; assessment scores and evidence references must be supplied by the caller.",
    note: "A decision or CRAFT recommendation is not an execution grant. WARP GATE and the authorized orchestrator must independently enforce permissions.",
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
    const craft = runCraftForGuidance(decision, parsed.data.blockers);
    return NextResponse.json({
      engine: "COSMOS Guidance Decision Engine",
      version: "1.0.0",
      mode: "decision_and_recommendation_only",
      ...decision,
      craft,
      executesActions: false,
    });
  } catch {
    return NextResponse.json({ error: "Guidance decision or CRAFT assessment validation failed." }, { status: 400 });
  }
}
