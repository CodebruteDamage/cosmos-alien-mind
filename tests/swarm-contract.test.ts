import test from "node:test";
import assert from "node:assert/strict";
import { heartbeatSchema, deriveNodeStatus } from "../lib/swarm-contract.ts";

test("accepts a minimal online heartbeat", () => {
  const result = heartbeatSchema.safeParse({ nodeId: "pc-main" });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.status, "online");
    assert.deepEqual(result.data.events, []);
  }
});

test("rejects malformed node IDs and event IDs", () => {
  assert.equal(heartbeatSchema.safeParse({ nodeId: "../admin" }).success, false);
  assert.equal(heartbeatSchema.safeParse({
    nodeId: "pc-main",
    events: [{ eventId: "not-a-uuid", type: "cpu.sample", payload: { percent: 12 } }],
  }).success, false);
});

test("limits telemetry batches to twenty events", () => {
  const events = Array.from({ length: 21 }, (_, i) => ({
    eventId: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    type: "cpu.sample",
    payload: { percent: i },
  }));
  assert.equal(heartbeatSchema.safeParse({ nodeId: "pc-main", events }).success, false);
});

test("derives online, degraded and offline from server heartbeat freshness", () => {
  const now = Date.parse("2026-10-22T12:00:00.000Z");
  assert.equal(deriveNodeStatus("2026-10-22T11:59:50.000Z", "online", now), "online");
  assert.equal(deriveNodeStatus("2026-10-22T11:59:20.000Z", "online", now), "degraded");
  assert.equal(deriveNodeStatus("2026-10-22T11:58:00.000Z", "online", now), "offline");
  assert.equal(deriveNodeStatus("invalid-date", "online", now), "offline");
});
