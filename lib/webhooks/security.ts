import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a timestamped HMAC-SHA256 webhook signature.
 * The signed message is: <unix-seconds>.<exact-raw-request-body>
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  timestamp: string | null,
  signature: string | null,
  secret: string,
  nowMs = Date.now(),
  toleranceSeconds = 300,
): boolean {
  if (!timestamp || !signature || !secret || Buffer.byteLength(secret, "utf8") < 32) {
    return false;
  }

  if (!/^\d{10}$/.test(timestamp) || !Number.isSafeInteger(Number(timestamp))) {
    return false;
  }

  if (!Number.isInteger(toleranceSeconds) || toleranceSeconds < 1) {
    return false;
  }

  const timestampSeconds = Number(timestamp);
  const nowSeconds = Math.floor(nowMs / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
    return false;
  }

  const match = /^sha256=([a-f0-9]{64})$/i.exec(signature);
  if (!match) return false;

  const supplied = Buffer.from(match[1], "hex");
  const expected = createHmac("sha256", secret)
    .update(timestamp, "utf8")
    .update(".", "utf8")
    .update(rawBody)
    .digest();

  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
