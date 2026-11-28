import { createNeonAuth } from "@neondatabase/auth/next/server";

const fallbackBaseUrl = "https://neon-auth-not-configured.invalid";
const fallbackCookieSecret =
  "COSMOS_BUILD_ONLY_NEON_AUTH_SECRET_NOT_VALID_FOR_RUNTIME_000000000000000000";

const baseUrl = process.env.NEON_AUTH_BASE_URL ?? fallbackBaseUrl;
const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ?? fallbackCookieSecret;

/**
 * Neon-managed authentication server.
 *
 * Build-only fallbacks let CI compile without local credentials. Every
 * runtime entry point checks isNeonAuthConfigured() and fails closed until
 * both real server-side variables are present.
 */
export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    sessionDataTtl: 300,
    sameSite: "lax",
  },
});

export function isNeonAuthConfigured(): boolean {
  return Boolean(
    process.env.NEON_AUTH_BASE_URL &&
    process.env.NEON_AUTH_COOKIE_SECRET &&
    process.env.NEON_AUTH_COOKIE_SECRET.length >= 32,
  );
}
