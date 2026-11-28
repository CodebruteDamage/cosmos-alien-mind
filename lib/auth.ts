import { Pool } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://disabled:disabled@127.0.0.1:5432/cosmos_disabled";
const authSecret = process.env.BETTER_AUTH_SECRET ?? "cosmos-build-only-secret-not-valid-for-runtime-000000";
const applicationUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  database: new Pool({ connectionString: databaseUrl, max: 5 }),
  secret: authSecret,
  baseURL: applicationUrl,
  trustedOrigins: [applicationUrl],
  emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  plugins: [organization({ allowUserToCreateOrganization: true })],
});

export function isBetterAuthConfigured(): boolean {
  const database = process.env.DATABASE_URL;
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!database || !secret || secret.length < 32 || !baseURL) return false;

  try {
    const databaseProtocol = new URL(database).protocol;
    const application = new URL(baseURL);
    const supportedDatabase = databaseProtocol === "postgres:" || databaseProtocol === "postgresql:";
    const supportedOrigin = application.protocol === "http:" || application.protocol === "https:";
    const productionTransport = process.env.NODE_ENV !== "production" || application.protocol === "https:";
    return supportedDatabase && supportedOrigin && productionTransport;
  } catch {
    return false;
  }
}
