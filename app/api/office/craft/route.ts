import { NextRequest, NextResponse } from "next/server";
import { buildCraftRemediationPlan, DEMO_CRAFT_BLOCKERS, CraftBlockerSchema } from "@/app/office/craft-contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const blockers = DEMO_CRAFT_BLOCKERS.map((item) => CraftBlockerSchema.parse(item));
  return NextResponse.json({
    mode: "demo",
    source: "static-fixture",
    operational: false,
    blockers,
    notice: "Demo fixture only. Live CI/analyzer ingestion is not connected."
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.blockerId !== "string") {
    return NextResponse.json({ error: "A blockerId is required." }, { status: 400 });
  }
  const blocker = DEMO_CRAFT_BLOCKERS.find((item) => item.blockerId === body.blockerId);
  if (!blocker) {
    return NextResponse.json({ error: "Blocker not found in the current demo dataset." }, { status: 404 });
  }
  const plan = buildCraftRemediationPlan(blocker);
  return NextResponse.json({
    mode: "proposal",
    executable: false,
    approvalRequired: true,
    plan
  });
}
