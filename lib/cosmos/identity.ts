import { z } from "zod";

/**
 * Identity claims must be returned by a trusted provider that has already
 * verified the credential signature, issuer, audience and token lifetime.
 * This module validates the returned claim shape; it is not a JWT verifier.
 */
const nonEmpty = z.string().trim().min(1);

export const AuthenticatedPrincipalSchema = z.object({
  subject: nonEmpty,
  tenantId: nonEmpty,
  issuer: nonEmpty,
  roles: z.array(nonEmpty),
  scopes: z.array(nonEmpty),
  issuedAt: z.string().refine((value) => Number.isFinite(Date.parse(value))),
  expiresAt: z.string().refine((value) => Number.isFinite(Date.parse(value))),
  authorizationRef: nonEmpty,
}).strict();

export type AuthenticatedPrincipal = z.infer<typeof AuthenticatedPrincipalSchema>;

export interface IdentityProvider {
  /**
   * Verify the incoming credential cryptographically and return trusted claims.
   * Implementations must validate signature, issuer, audience, expiry and
   * applicable revocation/session policy. Never return merely decoded claims.
   */
  verifyRequest(request: Request): Promise<unknown>;
}

export type IdentityFailure =
  | "IDENTITY_PROVIDER_NOT_CONFIGURED"
  | "CREDENTIAL_REJECTED"
  | "INVALID_PRINCIPAL"
  | "PRINCIPAL_EXPIRED";

export type IdentityResult =
  | { ok: true; principal: AuthenticatedPrincipal }
  | { ok: false; reason: IdentityFailure };

/**
 * Fail-closed identity boundary. No provider, provider error, malformed claims
 * or expired claims all produce an unauthenticated result.
 */
export async function authenticateRequest(
  request: Request,
  provider?: IdentityProvider,
  now: number = Date.now(),
): Promise<IdentityResult> {
  if (!provider) {
    return { ok: false, reason: "IDENTITY_PROVIDER_NOT_CONFIGURED" };
  }

  let claims: unknown;
  try {
    claims = await provider.verifyRequest(request);
  } catch {
    return { ok: false, reason: "CREDENTIAL_REJECTED" };
  }

  const parsed = AuthenticatedPrincipalSchema.safeParse(claims);
  if (!parsed.success) {
    return { ok: false, reason: "INVALID_PRINCIPAL" };
  }

  const issuedAt = Date.parse(parsed.data.issuedAt);
  const expiresAt = Date.parse(parsed.data.expiresAt);

  if (expiresAt <= now || expiresAt <= issuedAt) {
    return { ok: false, reason: "PRINCIPAL_EXPIRED" };
  }

  // Allow only a small clock-skew tolerance; future-issued claims are invalid.
  if (issuedAt > now + 60_000) {
    return { ok: false, reason: "INVALID_PRINCIPAL" };
  }

  return { ok: true, principal: parsed.data };
}

/** Prevents a request from crossing the authenticated tenant boundary. */
export function principalMatchesTenant(
  principal: AuthenticatedPrincipal,
  requestedTenantId: string,
): boolean {
  return principal.tenantId === requestedTenantId;
}
