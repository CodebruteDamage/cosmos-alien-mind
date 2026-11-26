import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;

function authorize(request: NextRequest): NextResponse | null {
  const expected = process.env.COSMOS_SWARM_TOKEN;
  if (!expected || expected.length < 32) return NextResponse.json({ ok: false, error: "Swarm authentication is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const header = request.headers.get("authorization") ?? "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return null;
}

export async function GET(request: NextRequest) {
  const denied = authorize(request); if (denied) return denied;
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const rawLimit = request.nextUrl.searchParams.get("limit");
  const limit = rawLimit === null ? DEFAULT_LIMIT : Number(rawLimit);
  const rawWindow = request.nextUrl.searchParams.get("window");
  const windowMinutes = rawWindow === null ? 60 : Number(rawWindow);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT || !Number.isInteger(windowMinutes) || windowMinutes < 5 || windowMinutes > 1440) return NextResponse.json({ ok: false, error: "Invalid limit or time window." }, { status: 400 });
  try {
    const sql = getSql();
    const rows = await sql`
      WITH recent AS (
        SELECT seq, node_id, event_type, payload, created_at
        FROM cosmos_swarm_events WHERE created_at >= NOW() - (${windowMinutes}::text || ' minutes')::interval
        ORDER BY seq DESC LIMIT ${limit}
      ),
      counts AS (
        SELECT COUNT(*)::int AS total_events, COUNT(DISTINCT node_id)::int AS active_nodes,
          COUNT(*) FILTER (WHERE event_type ILIKE '%error%' OR event_type ILIKE '%fail%')::int AS error_events,
          COUNT(*) FILTER (WHERE event_type ILIKE '%security%' OR event_type ILIKE '%policy%' OR event_type ILIKE '%blocked%')::int AS security_events FROM recent
      ),
      by_type AS (SELECT event_type, COUNT(*)::int AS count FROM recent GROUP BY event_type ORDER BY count DESC, event_type LIMIT 12),
      by_node AS (SELECT node_id, COUNT(*)::int AS count FROM recent GROUP BY node_id ORDER BY count DESC, node_id LIMIT 10),
      timeline AS (
        SELECT date_trunc('minute', created_at) AS bucket, COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE event_type ILIKE '%error%' OR event_type ILIKE '%fail%')::int AS errors,
          COUNT(*) FILTER (WHERE event_type ILIKE '%security%' OR event_type ILIKE '%policy%' OR event_type ILIKE '%blocked%')::int AS security
        FROM recent GROUP BY bucket ORDER BY bucket
      )
      SELECT (SELECT row_to_json(counts) FROM counts) AS summary,
        COALESCE((SELECT json_agg(by_type ORDER BY count DESC) FROM by_type), '[]'::json) AS event_types,
        COALESCE((SELECT json_agg(by_node ORDER BY count DESC) FROM by_node), '[]'::json) AS nodes,
        COALESCE((SELECT json_agg(timeline ORDER BY bucket) FROM timeline), '[]'::json) AS timeline,
        COALESCE((SELECT MAX(seq) FROM recent), 0) AS latest_seq,
        (SELECT MAX(created_at) FROM recent) AS latest_event_at
    `;
    const row = rows[0];
    return NextResponse.json({ ok: true, source: "authenticated-swarm-events", generatedAt: new Date().toISOString(), windowMinutes, limit, summary: row?.summary ?? { total_events: 0, active_nodes: 0, error_events: 0, security_events: 0 }, eventTypes: row?.event_types ?? [], nodes: row?.nodes ?? [], timeline: row?.timeline ?? [], latestSeq: Number(row?.latest_seq ?? 0), latestEventAt: row?.latest_event_at ?? null, freshness: row?.latest_event_at ? "event-backed" : "no-events-in-window" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Analytics storage is unavailable. Verify the additive swarm schema." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}