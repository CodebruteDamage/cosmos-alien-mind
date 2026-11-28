import type { IdentityProvider } from "./identity";
import { auth, isNeonAuthConfigured } from "@/lib/auth";

export interface NeonAuthSessionSnapshot {
  user: { id: string };
  session: {
    id: string;
    createdAt: Date | string;
    expiresAt: Date | string;
    activeOrganizationId?: string | null;
  };
}

type SessionReader = () => Promise<NeonAuthSessionSnapshot | null>;
type ActiveMemberReader = () => Promise<unknown | null>;

function toIsoTimestamp(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("Neon Auth returned an invalid session timestamp.");
  }
  return date.toISOString();
}

/**
 * Maps a Neon Auth-verified session and current organization membership to
 * the COSMOS identity contract. User and tenant identifiers never come from
 * request headers, query parameters, or request bodies.
 */
export function createNeonAuthIdentityProvider(
  readSession: SessionReader,
  readActiveMember: ActiveMemberReader,
  authBaseUrl: string,
): IdentityProvider {
  return {
    async verifyRequest(): Promise<unknown> {
      const snapshot = await readSession();
      if (!snapshot?.user?.id || !snapshot.session?.id) {
        throw new Error("No valid Neon Auth session.");
      }

      const tenantId = snapshot.session.activeOrganizationId;
      if (!tenantId) {
        throw new Error("An active organization is required.");
      }

      // Re-check current membership on each protected API request so removed
      // organization members cannot rely on a stale active-organization value.
      const activeMember = await readActiveMember();
      if (!activeMember) {
        throw new Error("Current organization membership is required.");
      }

      return {
        subject: snapshot.user.id,
        tenantId,
        issuer: new URL(authBaseUrl).origin,
        // WARP GATE remains the authority for permissions and scopes.
        roles: ["authenticated"],
        scopes: [],
        issuedAt: toIsoTimestamp(snapshot.session.createdAt),
        expiresAt: toIsoTimestamp(snapshot.session.expiresAt),
        authorizationRef: snapshot.session.id,
      };
    },
  };
}

export function getIdentityProvider(): IdentityProvider | undefined {
  const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!isNeonAuthConfigured() || !authBaseUrl) return undefined;

  return createNeonAuthIdentityProvider(
    async () => {
      const result = await auth.getSession();
      if (result.error || !result.data) return null;
      return result.data as unknown as NeonAuthSessionSnapshot;
    },
    async () => {
      const result = await auth.organization.getActiveMember();
      if (result.error || !result.data) return null;
      return result.data;
    },
    authBaseUrl,
  );
}
