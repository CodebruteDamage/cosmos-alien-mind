import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidBridgeToken } from "@/lib/bridge-auth";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const heartbeatSchema = z.object({
  deviceId: z.string().regex(/^[a-zA-Z0-9._-]{3,80}$/),
  platform: z.string().min(1).max(40),
  architecture: z.string().min(1).max(40),
  runtime: z.object({
    node: z.string().max(40),
    npm: z.string().max(40).nullable().optional(),
    python: z.string().max(60).nullable().optional(),
    git: z.string().max(80).nullable().optional(),
  }).strict(),
}).strict();

export async function POST(request: NextRequest) {
  if (!isValidBridgeToken(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Bridge storage is not configured." }, { status: 503 });
  }

  const raw = await request.text();
  if (raw.length > 4096) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = heartbeatSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid heartbeat payload." }, { status: 400 });
  }

  try {
    const sql = getSql();
    const { deviceId, platform, architecture, runtime } = parsed.data;
    const rows = await sql`
      INSERT INTO bridge_devices (device_id, platform, architecture, runtime_versions, last_seen_at)
      VALUES (${deviceId}, ${platform}, ${architecture}, ${JSON.stringify(runtime)}::jsonb, NOW())
      ON CONFLICT (device_id) DO UPDATE SET
        platform = EXCLUDED.platform,
        architecture = EXCLUDED.architecture,
        runtime_versions = EXCLUDED.runtime_versions,
        last_seen_at = NOW()
      RETURNING device_id, last_seen_at
    `;

    return NextResponse.json({
      ok: true,
      service: "cosmos-android-bridge",
      deviceId: rows[0].device_id,
      receivedAt: rows[0].last_seen_at,
      capabilities: ["heartbeat"],
    });
  } catch {
    return NextResponse.json({ error: "Bridge storage unavailable." }, { status: 503 });
  }
}
