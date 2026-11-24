import { NextResponse } from "next/server";
import { getCosmaxxRuntimeSnapshot } from "@/lib/cosmaxx/runtime-adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getCosmaxxRuntimeSnapshot(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
