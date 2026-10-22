import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
  const expected = process.env.COSMOS_NODE_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "database_not_configured" }, { status: 503 });
  }
  try {
    const sql = getSql();
    const nodes = await sql`SELECT node_id, display_name, runtime, status, version, last_seen_at,
      GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - last_seen_at))))::int AS seconds_since_seen
      FROM cosmos_nodes ORDER BY last_seen_at DESC LIMIT 100`;
    return NextResponse.json({ ok: true, nodes }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "node_registry_unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "node_authentication_required" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "database_not_configured" }, { status: 503 });
  }
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
  const value = body as Record<string, unknown>;
  const nodeId = typeof value.nodeId === "string" ? value.nodeId.trim() : "";
  const displayName = typeof value.displayName === "string" ? value.displayName.trim() : "";
  const runtimeName = value.runtime;
  const version = typeof value.version === "string" ? value.version.slice(0, 80) : null;
  const metadata = value.metadata && typeof value.metadata === "object" && !Array.isArray(value.metadata) ? value.metadata : {};
  if (!/^[a-zA-Z0-9._:-]{1,128}$/.test(nodeId) || !displayName || displayName.length > 100 ||
      !["local-pc", "web", "mobile", "service"].includes(String(runtimeName))) {
    return NextResponse.json({ ok: false, error: "invalid_node_fields" }, { status: 400 });
  }
  try {
    const sql = getSql();
    await sql`INSERT INTO cosmos_nodes (node_id, display_name, runtime, status, version, last_seen_at, metadata)
      VALUES (${nodeId}, ${displayName}, ${String(runtimeName)}, 'online', ${version}, NOW(), ${JSON.stringify(metadata)}::jsonb)
      ON CONFLICT (node_id) DO UPDATE SET display_name = EXCLUDED.display_name, runtime = EXCLUDED.runtime,
      status = 'online', version = EXCLUDED.version, last_seen_at = NOW(), metadata = EXCLUDED.metadata`;
    await sql`INSERT INTO cosmos_node_events (node_id, event_type, payload)
      VALUES (${nodeId}, 'heartbeat', ${JSON.stringify({ runtime: runtimeName, version })}::jsonb)`;
    return NextResponse.json({ ok: true, accepted: true, nodeId, receivedAt: new Date().toISOString() }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false, error: "heartbeat_persistence_failed" }, { status: 503 });
  }
}
