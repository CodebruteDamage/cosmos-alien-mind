import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, service: "cosmos-alien-mind", database: "not_configured" },
      { status: 503 },
    );
  }

  try {
    const sql = getSql();
    const result = await sql`SELECT 1 AS connected, NOW() AS database_time`;
    return NextResponse.json({
      ok: true,
      service: "cosmos-alien-mind",
      database: "connected",
      checkedAt: result[0]?.database_time ?? null,
    });
  } catch {
    // Do not return connection strings or provider internals to public clients.
    return NextResponse.json(
      { ok: false, service: "cosmos-alien-mind", database: "unavailable" },
      { status: 503 },
    );
  }
}
