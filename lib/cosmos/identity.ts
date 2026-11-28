import { z } from "zod";

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
  // Implementations must verify credentials/session state, not merely decode claims.
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

export async function authenticateRequest(
  request: Request,
  provider?: IdentityProvider,
  now: number = Date.now(),
): Promise<IdentityResult> {
  if (!provider) return { ok: false, reason: "IDENTITY_PROVIDER_NOT_CONFIGURED" };

  let claims: unknown;
  try {
    claims = await provider.verifyRequest(request);
  } catch {
    return { ok: false, reason: "CREDENTIAL_REJECTED" };
  }

  const parsed = AuthenticatedPrincipalSchema.safeParse(claims);
  if (!parsed.success) return { ok: false, reason: "INVALID_PRINCIPAL" };

  const issuedAt = Date.parse(parsed.data.issuedAt);
  const expiresAt = Date.parse(parsed.data.expiresAt);
  if (expiresAt <= now || expiresAt <= issuedAt) return { ok: false, reason: "PRINCIPAL_EXPIRED" };
  if (issuedAt > now + 60_000) return { ok: false, reason: "INVALID_PRINCIPAL" };

  return { ok: true, principal: parsed.data };
}

export function principalMatchesTenant(principal: AuthenticatedPrincipal, requestedTenantId: string): boolean {
  return principal.tenantId === requestedTenantId;
}
