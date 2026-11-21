import type { IdentityProvider } from "./identity";

/**
 * The provider adapter is intentionally unconfigured until a concrete
 * OIDC/session provider is selected and its cryptographic verification
 * contract is implemented.
 *
 * Never replace this with decoded JWT claims, request headers, or client
 * supplied identity fields. The API remains fail-closed while this returns
 * undefined.
 */
export function getIdentityProvider(): IdentityProvider | undefined {
  return undefined;
}
