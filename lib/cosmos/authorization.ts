import type { AuthenticatedPrincipal } from "./identity";

export type ProtectedOperation = "conversation.read" | "conversation.create";

export interface AuthorizationDecision {
  allow: boolean;
  decisionId?: string;
  reason: string;
}

export interface WarpGateProvider {
  authorize(input: {
    principal: AuthenticatedPrincipal;
    operation: ProtectedOperation;
    resource: "conversation";
  }): Promise<AuthorizationDecision>;
}

/**
 * WARP GATE is the authorization authority. No local fallback policy is
 * permitted: until a verified WARP GATE adapter is configured, access is denied.
 */
export async function authorizeProtectedOperation(
  principal: AuthenticatedPrincipal,
  operation: ProtectedOperation,
  provider?: WarpGateProvider,
): Promise<AuthorizationDecision> {
  if (!provider) return { allow: false, reason: "WARP_GATE_NOT_CONFIGURED" };
  try {
    const decision = await provider.authorize({ principal, operation, resource: "conversation" });
    if (!decision || decision.allow !== true || !decision.decisionId) {
      return { allow: false, reason: decision?.reason ?? "WARP_GATE_DENIED" };
    }
    return decision;
  } catch {
    return { allow: false, reason: "WARP_GATE_UNAVAILABLE" };
  }
}
