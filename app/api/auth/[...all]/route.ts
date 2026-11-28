import { NextResponse } from "next/server";
import { auth, isNeonAuthConfigured } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = auth.handler();

function unavailable() {
  return NextResponse.json(
    {
      error: {
        code: "AUTH_NOT_CONFIGURED",
        message: "Neon Auth is not configured on this server.",
      },
    },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  if (!isNeonAuthConfigured()) return unavailable();
  return handlers.GET(request);
}

export async function POST(request: Request) {
  if (!isNeonAuthConfigured()) return unavailable();
  return handlers.POST(request);
}
