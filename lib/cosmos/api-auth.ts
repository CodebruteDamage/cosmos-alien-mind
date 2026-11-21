import {
  authenticateRequest,
  type AuthenticatedPrincipal,
  type IdentityFailure,
} from "./identity";
import { getIdentityProvider } from "./identity-provider";

export type ApiAuthResult =
  | { ok: true; principal: AuthenticatedPrincipal }
  | { ok: false; reason: IdentityFailure; status: 401 | 503 };

/**
 * Shared API authentication boundary.
 * The default provider is deliberately absent until a verified adapter is
 * configured. Tests and future adapters may inject a trusted provider.
 */
export async function authenticateApiRequest(
  request: Request,
  provider = getIdentityProvider(),
): Promise<ApiAuthResult> {
  const result = await authenticateRequest(request, provider);
  if (result.ok) return result;

  return {
    ok: false,
    reason: result.reason,
    status: result.reason === "IDENTITY_PROVIDER_NOT_CONFIGURED" ? 503 : 401,
  };
}
