import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { evaluateGapTransition, GAP_CYCLE_STAGES, GAP_CYCLE_VERSION } from "@/lib/gap-cycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  currentStageId: z.enum(["GAP", "ANALYSIS", "PARALYSIS", "ROOT_CAUSE", "SHAPE", "OPTIMIZATION", "PROVISION", "BUILD", "TEST", "VALIDATE", "CLOSE", "EVOLVE"]).nullable(),
  nextStageId: z.enum(["GAP", "ANALYSIS", "PARALYSIS", "ROOT_CAUSE", "SHAPE", "OPTIMIZATION", "PROVISION", "BUILD", "TEST", "VALIDATE", "CLOSE", "EVOLVE"]),
  objective: z.string().trim().min(1).max(4000),
  evidenceRefs: z.array(z.string().trim().min(1).max(2000)).max(100),
  rationale: z.string().trim().max(4000).optional(),
  scopeApproved: z.boolean(),
  dependenciesSatisfied: z.boolean(),
  riskClass: z.enum(["R0", "R1", "R2", "R3"]),
  approvalValid: z.boolean(),
  testsPassed: z.boolean(),
  acceptanceCriteriaSatisfied: z.boolean(),
  stopRequested: z.boolean(),
});

export async function GET() {
  return NextResponse.json({
    engine: "COSMOS 12 GAP CYCLE",
    version: GAP_CYCLE_VERSION,
    mode: "governed_stage_transition_only",
    stages: GAP_CYCLE_STAGES,
    executesActions: false,
    persistsState: false,
    governance: "Guidance decides; CRAFT remains recommendation-only; WARP GATE and the authorized executor independently enforce permissions before side effects.",
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
      error: "Invalid 12 GAP Cycle transition input.",
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    }, { status: 400 });
  }

  try {
    const transition = evaluateGapTransition(parsed.data);
    return NextResponse.json({
      engine: "COSMOS 12 GAP CYCLE",
      version: GAP_CYCLE_VERSION,
      mode: "governed_stage_transition_only",
      ...transition,
      executesActions: false,
      persistsState: false,
    });
  } catch {
    return NextResponse.json({ error: "12 GAP Cycle transition evaluation failed." }, { status: 400 });
  }
}
