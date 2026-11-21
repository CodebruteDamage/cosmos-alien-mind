import type { IdentityProvider } from "./identity";
import { auth, isBetterAuthConfigured } from "@/lib/auth";

export interface BetterAuthSessionSnapshot {
  user: { id: string };
  session: {
    id: string;
    createdAt: Date | string;
    expiresAt: Date | string;
    activeOrganizationId?: string | null;
  };
}

type SessionReader = (headers: Headers) => Promise<BetterAuthSessionSnapshot | null>;

/**
 * Adapts a server-verified Better Auth session into the COSMOS identity
 * contract. Tenant identity is accepted only from the active organization
 * stored in the verified session, never from request data.
 */
export function createBetterAuthIdentityProvider(
  readSession: SessionReader,
): IdentityProvider {
  return {
    async verifyRequest(request: Request): Promise<unknown> {
      const snapshot = await readSession(request.headers);
      if (!snapshot) throw new Error("No valid Better Auth session.");
      const tenantId = snapshot.session.activeOrganizationId;
      if (!tenantId) throw new Error("An active organization is required.");

      const baseURL = process.env.BETTER_AUTH_URL;
      if (!baseURL) throw new Error("Better Auth base URL is not configured.");

      return {
        subject: snapshot.user.id,
        tenantId,
        issuer: new URL(baseURL).origin,
        // WARP GATE remains the authority for permissions and scopes.
        roles: ["authenticated"],
        scopes: [],
        issuedAt: new Date(snapshot.session.createdAt).toISOString(),
        expiresAt: new Date(snapshot.session.expiresAt).toISOString(),
        authorizationRef: snapshot.session.id,
      };
    },
  };
}

export function getIdentityProvider(): IdentityProvider | undefined {
  if (!isBetterAuthConfigured()) return undefined;

  return createBetterAuthIdentityProvider(async (headers) => {
    const session = await auth.api.getSession({ headers });
    if (!session) return null;

    // Re-check current membership on each request. A stale active organization
    // in a session must not survive removal from that organization's members.
    const activeMember = await auth.api.getActiveMember({ headers });
    if (!activeMember) return null;

    return session as unknown as BetterAuthSessionSnapshot;
  });
}
