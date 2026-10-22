import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const encoder = new TextEncoder();
  let stopped = false;
  let previous = "";
  let timer: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (!stopped) {
          try { controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)); }
          catch { stopped = true; }
        }
      };
      const poll = async () => {
        if (stopped) return;
        if (!process.env.DATABASE_URL) {
          send("status", { ok: false, error: "database_not_configured" });
          return;
        }
        try {
          const sql = getSql();
          const nodes = await sql`SELECT node_id, display_name, runtime, status, version, last_seen_at,
            GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - last_seen_at))))::int AS seconds_since_seen
            FROM cosmos_nodes ORDER BY last_seen_at DESC LIMIT 100`;
          const payload = JSON.stringify(nodes);
          if (payload !== previous) {
            previous = payload;
            send("nodes", { ok: true, nodes, emittedAt: new Date().toISOString() });
          }
        } catch {
          send("status", { ok: false, error: "node_registry_unavailable" });
        }
      };
      send("ready", { service: "cosmos-node-stream", at: new Date().toISOString() });
      await poll();
      if (!stopped) timer = setInterval(() => { void poll(); }, 2500);
    },
    cancel() {
      stopped = true;
      if (timer) clearInterval(timer);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
