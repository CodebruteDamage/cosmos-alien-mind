import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import {
  DEFAULT_EVENT_LIMIT,
  DEGRADED_AFTER_SECONDS,
  MAX_EVENT_LIMIT,
  OFFLINE_AFTER_SECONDS,
  heartbeatSchema,
} from "@/lib/swarm-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: NextRequest): NextResponse | null {
  const expected = process.env.COSMOS_SWARM_TOKEN;
  if (!expected || expected.length < 32) {
    return NextResponse.json(
      { error: "Swarm authentication is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  const valid = suppliedBuffer.length === expectedBuffer.length
    && timingSafeEqual(suppliedBuffer, expectedBuffer);

  if (!valid) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return null;
}

function databaseUnavailable() {
  return NextResponse.json(
    { error: "Swarm storage is unavailable. Check database configuration and apply db/swarm-schema.sql." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const denied = authorize(request);
  if (denied) return denied;
  if (!process.env.DATABASE_URL) return databaseUnavailable();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = heartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid heartbeat or telemetry event payload.", issues: parsed.error.issues.map(({ path, code }) => ({ path, code })) },
      { status: 400 },
    );
  }

  const metadata = JSON.stringify(parsed.data.metadata);
  const events = JSON.stringify(parsed.data.events);
  if (Buffer.byteLength(metadata, "utf8") > 8192 || Buffer.byteLength(events, "utf8") > 32768) {
    return NextResponse.json({ error: "Heartbeat metadata or event batch exceeds the allowed size." }, { status: 413 });
  }

  try {
    const sql = getSql();
    // One PostgreSQL statement keeps the node heartbeat and event append together.
    // event_id makes client telemetry replay-safe; duplicate event IDs are ignored.
    const rows = await sql`
      WITH node AS (
        INSERT INTO cosmos_swarm_nodes (node_id, status, metadata, last_seen_at, updated_at)
        VALUES (${parsed.data.nodeId}, ${parsed.data.status}, ${metadata}::jsonb, NOW(), NOW())
        ON CONFLICT (node_id) DO UPDATE SET
          status = EXCLUDED.status,
          metadata = EXCLUDED.metadata,
          last_seen_at = NOW(),
          updated_at = NOW()
        RETURNING node_id, status, last_seen_at
      ),
      heartbeat_event AS (
        INSERT INTO cosmos_swarm_events (event_id, node_id, event_type, payload)
        SELECT gen_random_uuid(), node_id, 'node.heartbeat',
          jsonb_build_object('status', status, 'lastSeenAt', last_seen_at)
        FROM node
        RETURNING seq
      ),
      telemetry_events AS (
        INSERT INTO cosmos_swarm_events (event_id, node_id, event_type, payload)
        SELECT (item.event->>'eventId')::uuid, node.node_id,
          item.event->>'type', COALESCE(item.event->'payload', '{}'::jsonb)
        FROM node
        CROSS JOIN jsonb_array_elements(${events}::jsonb) AS item(event)
        ON CONFLICT (event_id) DO NOTHING
        RETURNING seq
      )
      SELECT node.node_id, node.status, node.last_seen_at,
        (SELECT MAX(seq) FROM (
          SELECT seq FROM heartbeat_event
          UNION ALL
          SELECT seq FROM telemetry_events
        ) AS inserted_events) AS cursor
      FROM node
    `;

    return NextResponse.json(
      { ok: true, node: rows[0], acceptedEvents: parsed.data.events.length },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return databaseUnavailable();
  }
}

export async function GET(request: NextRequest) {
  const denied = authorize(request);
  if (denied) return denied;
  if (!process.env.DATABASE_URL) return databaseUnavailable();

  const afterParam = request.nextUrl.searchParams.get("after");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const after = afterParam === null ? null : Number(afterParam);
  const requestedLimit = limitParam === null ? DEFAULT_EVENT_LIMIT : Number(limitParam);

  if ((after !== null && (!Number.isSafeInteger(after) || after < 0))
    || !Number.isInteger(requestedLimit)
    || requestedLimit < 1
    || requestedLimit > MAX_EVENT_LIMIT) {
    return NextResponse.json({ error: "Invalid cursor or limit." }, { status: 400 });
  }

  try {
    const sql = getSql();
    if (after === null) {
      // Snapshot and cursor are read in one statement so clients can safely resume
      // from the returned cursor without skipping events that arrive during setup.
      const rows = await sql`
        SELECT
          COALESCE((
            SELECT json_agg(json_build_object(
              'nodeId', node_id,
              'reportedStatus', status,
              'status', CASE
                WHEN EXTRACT(EPOCH FROM (NOW() - last_seen_at)) > ${OFFLINE_AFTER_SECONDS} THEN 'offline'
                WHEN EXTRACT(EPOCH FROM (NOW() - last_seen_at)) > ${DEGRADED_AFTER_SECONDS}
                  OR status = 'degraded' THEN 'degraded'
                ELSE 'online'
              END,
              'metadata', metadata,
              'lastSeenAt', last_seen_at,
              'ageSeconds', GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - last_seen_at))))
            ) ORDER BY node_id)
            FROM cosmos_swarm_nodes
          ), '[]'::json) AS nodes,
          COALESCE((SELECT MAX(seq) FROM cosmos_swarm_events), 0) AS cursor
      `;
      return NextResponse.json(
        { mode: "snapshot", nodes: rows[0]?.nodes ?? [], cursor: Number(rows[0]?.cursor ?? 0) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const rows = await sql`
      SELECT seq, event_id, node_id, event_type, payload, created_at
      FROM cosmos_swarm_events
      WHERE seq > ${after}
      ORDER BY seq ASC
      LIMIT ${requestedLimit + 1}
    `;
    const hasMore = rows.length > requestedLimit;
    const events = hasMore ? rows.slice(0, requestedLimit) : rows;
    const nextCursor = events.length ? Number(events[events.length - 1].seq) : after;

    return NextResponse.json(
      {
        mode: "events",
        events: events.map((event) => ({ ...event, seq: Number(event.seq) })),
        cursor: nextCursor,
        hasMore,
        replayFrom: after,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return databaseUnavailable();
  }
}
