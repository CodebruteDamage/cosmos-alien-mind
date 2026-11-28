export type WarpGatePolicyDecision = { allowed: boolean; reason: string };

export type GovernedAction = "read" | "write" | "delete" | "external";
export type GovernedRisk = "low" | "moderate" | "high" | "critical";

export type WarpGateExecutionBinding = {
  actorId: string;
  tenantId: string;
  workflowId: string;
  stepId: string;
  capability: string;
  action: GovernedAction;
  scope: string;
  parametersDigest: string;
  policyVersion: string;
  risk: GovernedRisk;
  requiresHumanApproval: boolean;
};

export type WarpGateGrantClaims = WarpGateExecutionBinding & {
  grantId: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  approvalId?: string;
};

export type WarpGatePort = {
  authorize(input: {
    binding: WarpGateExecutionBinding;
    signal: AbortSignal;
  }): Promise<unknown>;
  verifyAndConsume(input: {
    executionGrant: string;
    expected: WarpGateExecutionBinding;
    signal: AbortSignal;
  }): Promise<unknown>;
};

export type WarpGateContractOptions = {
  authorizationTimeoutMs?: number;
  verificationTimeoutMs?: number;
  now?: () => number;
  maxClockSkewMs?: number;
};

const ACTIONS: readonly string[] = ["read", "write", "delete", "external"];
const RISKS: readonly string[] = ["low", "moderate", "high", "critical"];
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateWarpGateBinding(value: unknown): string[] {
  if (!isRecord(value)) return ["Execution binding must be an object."];
  const errors: string[] = [];
  for (const key of [
    "actorId", "tenantId", "workflowId", "stepId", "capability",
    "scope", "policyVersion",
  ]) {
    if (!nonEmpty(value[key])) errors.push(`${key} is required.`);
  }
  if (!ACTIONS.includes(String(value.action))) errors.push("action is invalid.");
  if (!RISKS.includes(String(value.risk))) errors.push("risk is invalid.");
  if (typeof value.requiresHumanApproval !== "boolean") {
    errors.push("requiresHumanApproval must be boolean.");
  } else if ((value.risk === "high" || value.risk === "critical") && value.requiresHumanApproval !== true) {
    errors.push("High and critical risk require explicit human approval.");
  }
  if (typeof value.parametersDigest !== "string" || !SHA256_PATTERN.test(value.parametersDigest)) {
    errors.push("parametersDigest must be a sha256 digest.");
  }
  return errors;
}

function claimsMatch(
  claims: unknown,
  expected: WarpGateExecutionBinding,
  now: number,
  maxClockSkewMs: number,
): claims is WarpGateGrantClaims {
  if (!isRecord(claims)) return false;
  const exactKeys: (keyof WarpGateExecutionBinding)[] = [
    "actorId", "tenantId", "workflowId", "stepId", "capability",
    "action", "scope", "parametersDigest", "policyVersion", "risk",
    "requiresHumanApproval",
  ];
  if (!exactKeys.every((key) => claims[key] === expected[key])) return false;
  if (!nonEmpty(claims.grantId) || !nonEmpty(claims.nonce)) return false;

  const issuedAt = Date.parse(String(claims.issuedAt));
  const expiresAt = Date.parse(String(claims.expiresAt));
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return false;
  if (issuedAt > now + maxClockSkewMs || expiresAt <= now || expiresAt <= issuedAt) return false;

  if (expected.requiresHumanApproval && !nonEmpty(claims.approvalId)) return false;
  if (claims.approvalId !== undefined && !nonEmpty(claims.approvalId)) return false;
  return true;
}

function denied(reason: string): WarpGatePolicyDecision {
  return { allowed: false, reason };
}

async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error(message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Fail-closed WARP GATE boundary contract.
 * The host must perform cryptographic signature/issuer checks and atomically
 * consume the nonce in verifyAndConsume. This helper does not implement crypto.
 */
export async function authorizeWarpGateExecution(
  gate: WarpGatePort,
  binding: WarpGateExecutionBinding,
  options: WarpGateContractOptions = {},
): Promise<WarpGatePolicyDecision> {
  const bindingErrors = validateWarpGateBinding(binding);
  if (bindingErrors.length) return denied("Invalid execution binding; authorization was not requested.");

  const authorizationTimeoutMs = options.authorizationTimeoutMs ?? 5_000;
  const verificationTimeoutMs = options.verificationTimeoutMs ?? 5_000;
  const maxClockSkewMs = options.maxClockSkewMs ?? 30_000;
  const now = options.now ?? Date.now;
  const currentTime = now();
  if (![authorizationTimeoutMs, verificationTimeoutMs, maxClockSkewMs, currentTime].every(Number.isFinite) ||
      authorizationTimeoutMs <= 0 || verificationTimeoutMs <= 0 || maxClockSkewMs < 0) {
    return denied("Invalid WARP GATE timeout or clock configuration.");
  }

  let authorization: unknown;
  try {
    authorization = await withTimeout(
      (signal) => gate.authorize({ binding, signal }),
      authorizationTimeoutMs,
      "WARP GATE authorization timed out.",
    );
  } catch {
    return denied("WARP GATE authorization failed or timed out; execution blocked.");
  }

  if (!isRecord(authorization) || typeof authorization.decision !== "string") {
    return denied("WARP GATE returned a malformed authorization decision.");
  }
  if (authorization.decision !== "ALLOW") {
    const reason = nonEmpty(authorization.reason) ? authorization.reason : "WARP GATE did not allow execution.";
    return denied(reason);
  }
  if (!nonEmpty(authorization.executionGrant)) {
    return denied("WARP GATE returned ALLOW without an execution grant.");
  }

  let verification: unknown;
  try {
    verification = await withTimeout(
      (signal) => gate.verifyAndConsume({
        executionGrant: authorization.executionGrant as string,
        expected: binding,
        signal,
      }),
      verificationTimeoutMs,
      "WARP GATE grant verification timed out.",
    );
  } catch {
    return denied("WARP GATE grant verification failed or timed out; execution blocked.");
  }

  if (!isRecord(verification) || verification.valid !== true ||
      !claimsMatch(verification.verifiedClaims, binding, currentTime, maxClockSkewMs)) {
    return denied("WARP GATE grant was invalid, expired, mismatched, or not atomically consumed.");
  }

  return { allowed: true, reason: "WARP GATE grant verified, binding matched, and nonce consumed." };
}
