import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth, isBetterAuthConfigured } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

function unavailable() {
  return NextResponse.json(
    { error: { code: "AUTH_NOT_CONFIGURED", message: "Authentication is not configured on this server." } },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  if (!isBetterAuthConfigured()) return unavailable();
  return handlers.GET(request);
}

export async function POST(request: Request) {
  if (!isBetterAuthConfigured()) return unavailable();
  return handlers.POST(request);
}
