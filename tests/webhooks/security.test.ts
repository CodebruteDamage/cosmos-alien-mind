import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyWebhookSignature } from "../../lib/webhooks/security";

const secret = "test-only-secret-material-at-least-32-bytes";
const body = Buffer.from(JSON.stringify({ event_id: "evt_001", event_type: "cosmos.test" }));

function signature(timestamp: string, rawBody = body) {
  const digest = createHmac("sha256", secret)
    .update(timestamp, "utf8")
    .update(".", "utf8")
    .update(rawBody)
    .digest("hex");
  return `sha256=${digest}`;
}

test("accepts a valid timestamped HMAC signature", () => {
  const now = 1_800_000_000_000;
  const timestamp = String(Math.floor(now / 1000));
  assert.equal(verifyWebhookSignature(body, timestamp, signature(timestamp), secret, now), true);
});

test("rejects a stale timestamp", () => {
  const now = 1_800_000_000_000;
  const timestamp = String(Math.floor(now / 1000) - 301);
  assert.equal(verifyWebhookSignature(body, timestamp, signature(timestamp), secret, now), false);
});

test("rejects a modified body", () => {
  const now = 1_800_000_000_000;
  const timestamp = String(Math.floor(now / 1000));
  assert.equal(
    verifyWebhookSignature(Buffer.from("tampered"), timestamp, signature(timestamp), secret, now),
    false,
  );
});

test("rejects malformed signatures and weak secrets", () => {
  const now = 1_800_000_000_000;
  const timestamp = String(Math.floor(now / 1000));
  assert.equal(verifyWebhookSignature(body, timestamp, "sha256=bad", secret, now), false);
  assert.equal(verifyWebhookSignature(body, timestamp, signature(timestamp), "short", now), false);
});
