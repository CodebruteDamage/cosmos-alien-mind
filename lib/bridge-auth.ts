import { timingSafeEqual } from "node:crypto";

/**
 * Validate a single server-side bridge bearer token.
 * The expected token must be provisioned as BRIDGE_SHARED_SECRET.
 */
export function isValidBridgeToken(authorization: string | null): boolean {
  const expected = process.env.BRIDGE_SHARED_SECRET;
  if (!expected || expected.length < 32 || !authorization) return false;
  if (!authorization.startsWith("Bearer ")) return false;

  const supplied = authorization.slice(7);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");

  if (expectedBuffer.length !== suppliedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, suppliedBuffer);
}
