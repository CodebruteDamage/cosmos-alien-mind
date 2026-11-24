/**
 * COSMOS M1.2 — fail-closed WARP GATE adapter.
 *
 * This is an application-side contract adapter, not a WARP GATE implementation.
 * A trusted transport/client must be injected by the server runtime.
 */
export type WarpDecision = "ALLOW" | "DENY" | "REQUIRE_APPROVAL" | "BLOCKED";

export interface LifecycleAuthorizationRequest {
  requestId: string;
  executionId: string;
  tenantId: string;
  subjectId: string;
  lifecycleId: string;
  capability: "cosmos.lifecycle";
  action: "create" | "advance";
  targetScope: readonly string[];
  fromStage: string | null;
  toStage: string;
  reason: string;
  evidenceRefs: readonly string[];
  policyVersion: string;
  traceId: string;
}

export interface WarpGateDecisionRecord {
  requestId: string;
  executionId: string;
  decision: WarpDecision;
  reason: string;
  policyVersion: string;
  principalId: string | null;
  tenantId: string | null;
  grantId: string | null;
  decidedAt: string;
}

export interface WarpGateAuthorizationResult {
  decision: WarpDecision;
  reason: string;
  record: WarpGateDecisionRecord;
  executionGrant?: string | null;
}

export interface WarpGateClient {
  authorize(request: LifecycleAuthorizationRequest): Promise<WarpGateAuthorizationResult>;
  verifyAndConsumeGrant(
    grant: string,
    request: LifecycleAuthorizationRequest,
  ): Promise<boolean>;
}

export type AuthorizationOutcome =
  | { authorized: true; decision: "ALLOW"; record: WarpGateDecisionRecord }
  | { authorized: false; decision: "DENY" | "REQUIRE_APPROVAL" | "BLOCKED"; reason: string; record?: WarpGateDecisionRecord };

function validRecord(
  record: WarpGateDecisionRecord | undefined,
  request: LifecycleAuthorizationRequest,
): record is WarpGateDecisionRecord {
  return Boolean(
    record &&
    record.requestId === request.requestId &&
    record.executionId === request.executionId &&
    record.tenantId === request.tenantId &&
    record.principalId === request.subjectId &&
    record.policyVersion === request.policyVersion &&
    typeof record.reason === "string" &&
    typeof record.decidedAt === "string" &&
    Number.isFinite(Date.parse(record.decidedAt)),
  );
}

/**
 * Only an explicit ALLOW with a matching decision record is accepted.
 * Approval-pending is deliberately non-authorizing; a later request must carry
 * separately verified approval through the trusted WARP GATE client.
 */
export async function authorizeLifecycle(
  client: WarpGateClient,
  request: LifecycleAuthorizationRequest,
): Promise<AuthorizationOutcome> {
  try {
    const result = await client.authorize(request);
    if (!result || !validRecord(result.record, request) || result.decision !== result.record.decision) {
      return { authorized: false, decision: "BLOCKED", reason: "warp_gate_response_invalid" };
    }
    if (result.decision !== "ALLOW") {
      return {
        authorized: false,
        decision: result.decision,
        reason: result.reason || result.record.reason || "authorization_not_granted",
        record: result.record,
      };
    }
    if (!result.executionGrant || typeof result.executionGrant !== "string") {
      return { authorized: false, decision: "BLOCKED", reason: "execution_grant_missing", record: result.record };
    }
    // Verification must validate signature, issuer/audience, expiry, tenant,
    // execution, capability/action, exact scope, policy version and single use.
    const grantValid = await client.verifyAndConsumeGrant(result.executionGrant, request);
    if (grantValid !== true) {
      return { authorized: false, decision: "BLOCKED", reason: "execution_grant_invalid", record: result.record };
    }
    return { authorized: true, decision: "ALLOW", record: result.record };
  } catch {
    return { authorized: false, decision: "BLOCKED", reason: "warp_gate_unavailable" };
  }
}
