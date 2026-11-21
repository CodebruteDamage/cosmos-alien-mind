import { Pool } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://disabled:disabled@127.0.0.1:5432/cosmos_disabled";

const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  "cosmos-build-only-secret-not-valid-for-runtime-000000";

const applicationUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

/**
 * Better Auth configuration.
 *
 * The fallback values exist only so Next.js can statically compile without
 * deployment secrets. All auth HTTP handlers and API identity resolution are
 * disabled unless DATABASE_URL, BETTER_AUTH_SECRET and BETTER_AUTH_URL are
 * explicitly configured in the server environment.
 */
export const auth = betterAuth({
  database: new Pool({
    connectionString: databaseUrl,
    max: 5,
  }),
  secret: authSecret,
  baseURL: applicationUrl,
  trustedOrigins: [applicationUrl],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
  ],
});

export function isBetterAuthConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_URL,
  );
}
