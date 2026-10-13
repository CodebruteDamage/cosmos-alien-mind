import { neon } from "@neondatabase/serverless";

/**
 * Server-only database client.
 * DATABASE_URL must be configured in the server environment and must never be
 * exposed via NEXT_PUBLIC_* or imported into client components.
 */
export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(connectionString);
}
