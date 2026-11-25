import { z } from "zod";

export const nodeIdSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

const jsonObjectSchema = z.record(z.string(), z.unknown());

export const telemetryEventSchema = z.object({
  eventId: z.string().uuid(),
  type: z.string().min(1).max(80).regex(/^[a-zA-Z0-9._:-]+$/),
  payload: jsonObjectSchema.optional().default({}),
}).strict();

export const heartbeatSchema = z.object({
  nodeId: nodeIdSchema,
  status: z.enum(["online", "degraded"]).default("online"),
  metadata: jsonObjectSchema.optional().default({}),
  events: z.array(telemetryEventSchema).max(20).optional().default([]),
}).strict();

export type HeartbeatInput = z.infer<typeof heartbeatSchema>;

export const DEFAULT_EVENT_LIMIT = 100;
export const MAX_EVENT_LIMIT = 500;
export const DEGRADED_AFTER_SECONDS = 30;
export const OFFLINE_AFTER_SECONDS = 90;

/** Derive freshness from the last server-recorded heartbeat, never client time. */
export function deriveNodeStatus(
  lastSeenAt: Date | string,
  reportedStatus: "online" | "degraded",
  nowMs = Date.now(),
): "online" | "degraded" | "offline" {
  const lastSeenMs = lastSeenAt instanceof Date
    ? lastSeenAt.getTime()
    : Date.parse(lastSeenAt);
  if (!Number.isFinite(lastSeenMs)) return "offline";
  const ageSeconds = Math.max(0, (nowMs - lastSeenMs) / 1000);
  if (ageSeconds > OFFLINE_AFTER_SECONDS) return "offline";
  if (ageSeconds > DEGRADED_AFTER_SECONDS || reportedStatus === "degraded") return "degraded";
  return "online";
}
