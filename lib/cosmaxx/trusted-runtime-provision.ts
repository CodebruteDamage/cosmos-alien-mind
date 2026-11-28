export type RuntimeDependencyId =
  | "identity"
  | "grant_verifier"
  | "nonce_store"
  | "approval_store"
  | "audit_sink"
  | "provider_registry";

export type RuntimeDependencyAttestation = {
  dependency: RuntimeDependencyId;
  implementationId: string;
  environment: "development" | "staging" | "production";
  evidenceRef: string;
  verifiedAt: string;
  expiresAt: string;
  capabilities: string[];
};

export type RuntimeDependencyProbe = {
  attest(): Promise<RuntimeDependencyAttestation>;
  healthCheck(signal: AbortSignal): Promise<{ healthy: boolean; detail?: string }>;
};

export type TrustedRuntimeDependencies = Record<RuntimeDependencyId, RuntimeDependencyProbe>;

export type RuntimeReadinessItem = {
  dependency: RuntimeDependencyId;
  ready: boolean;
  reasons: string[];
  attestation?: RuntimeDependencyAttestation;
};

export type TrustedRuntimeReadiness = {
  status: "blocked" | "ready_for_review";
  productionActivationAllowed: false;
  items: RuntimeReadinessItem[];
  blockers: string[];
};

const REQUIRED_CAPABILITIES: Record<RuntimeDependencyId, readonly string[]> = {
  identity: ["authenticated_actor", "tenant_binding", "server_side_identity"],
  grant_verifier: ["signature_verification", "trusted_issuer", "exact_claim_binding"],
  nonce_store: ["atomic_consume", "replay_rejection", "durable_storage"],
  approval_store: ["approval_lookup", "actor_binding", "immutable_decision"],
  audit_sink: ["append_only", "durable_write", "correlation_id"],
  provider_registry: ["trusted_registration", "capability_attestation", "revocation_check"],
};

const DEPENDENCIES = Object.keys(REQUIRED_CAPABILITIES) as RuntimeDependencyId[];

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseTime(value: unknown): number {
  return typeof value === "string" ? Date.parse(value) : Number.NaN;
}

function validateAttestation(
  dependency: RuntimeDependencyId,
  value: unknown,
  now: number,
  expectedEnvironment: RuntimeDependencyAttestation["environment"],
): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return ["Attestation is missing or malformed."];
  }
  const attestation = value as Record<string, unknown>;
  const reasons: string[] = [];
  if (attestation.dependency !== dependency) reasons.push("Dependency identity does not match.");
  if (!nonEmpty(attestation.implementationId)) reasons.push("Implementation identity is missing.");
  if (!nonEmpty(attestation.evidenceRef)) reasons.push("Evidence reference is missing.");
  if (attestation.environment !== expectedEnvironment) reasons.push("Environment does not match the requested target.");
  const verifiedAt = parseTime(attestation.verifiedAt);
  const expiresAt = parseTime(attestation.expiresAt);
  if (!Number.isFinite(verifiedAt) || verifiedAt > now) reasons.push("Attestation verification time is invalid.");
  if (!Number.isFinite(expiresAt) || expiresAt <= now || expiresAt <= verifiedAt) {
    reasons.push("Attestation is expired or has an invalid validity window.");
  }
  const capabilities = attestation.capabilities;
  if (!Array.isArray(capabilities) || !REQUIRED_CAPABILITIES[dependency].every(
    (capability) => capabilities.includes(capability),
  )) reasons.push("Required security capabilities are not attested.");
  return reasons;
}

/**
 * Readiness-only provisioning gate. It probes host-supplied adapters but never
 * creates credentials, mutates infrastructure, enables dispatch, or activates production.
 * A ready result means "eligible for independent review", not production approval.
 */
export async function assessTrustedRuntimeProvision(
  dependencies: Partial<TrustedRuntimeDependencies>,
  options: {
    environment: RuntimeDependencyAttestation["environment"];
    now?: () => number;
    timeoutMs?: number;
  },
): Promise<TrustedRuntimeReadiness> {
  const now = options.now ?? Date.now;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const timestamp = now();
  const blockers: string[] = [];
  const items: RuntimeReadinessItem[] = [];

  if (!Number.isFinite(timestamp) || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return {
      status: "blocked",
      productionActivationAllowed: false,
      items: [],
      blockers: ["Invalid readiness clock or timeout configuration."],
    };
  }

  for (const dependency of DEPENDENCIES) {
    const adapter = dependencies[dependency];
    if (!adapter || typeof adapter.attest !== "function" || typeof adapter.healthCheck !== "function") {
      const reason = "Trusted host adapter is not configured.";
      items.push({ dependency, ready: false, reasons: [reason] });
      blockers.push(`${dependency}: ${reason}`);
      continue;
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        Promise.all([adapter.attest(), adapter.healthCheck(controller.signal)]),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("Readiness probe timed out."));
          }, timeoutMs);
        }),
      ]);
      const [attestation, health] = result;
      const reasons = validateAttestation(dependency, attestation, now(), options.environment);
      if (!health || health.healthy !== true) reasons.push("Host adapter health check did not pass.");
      if (health && health.healthy !== true && nonEmpty(health.detail)) reasons.push(health.detail);
      const ready = reasons.length === 0;
      items.push({ dependency, ready, reasons, ...(ready ? { attestation } : {}) });
      if (!ready) blockers.push(`${dependency}: ${reasons.join(" ")}`);
    } catch {
      const reason = "Attestation or health probe failed; dependency remains unavailable.";
      items.push({ dependency, ready: false, reasons: [reason] });
      blockers.push(`${dependency}: ${reason}`);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return {
    status: blockers.length === 0 ? "ready_for_review" : "blocked",
    productionActivationAllowed: false,
    items,
    blockers,
  };
}
