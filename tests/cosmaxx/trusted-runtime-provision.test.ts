import assert from "node:assert/strict";
import test from "node:test";
import {
  assessTrustedRuntimeProvision,
  type RuntimeDependencyAttestation,
  type RuntimeDependencyId,
  type RuntimeDependencyProbe,
  type TrustedRuntimeDependencies,
} from "../../lib/cosmaxx/trusted-runtime-provision";

const NOW = Date.parse("2026-11-28T12:00:00.000Z");
const capabilities: Record<RuntimeDependencyId, string[]> = {
  identity: ["authenticated_actor", "tenant_binding", "server_side_identity"],
  grant_verifier: ["signature_verification", "trusted_issuer", "exact_claim_binding"],
  nonce_store: ["atomic_consume", "replay_rejection", "durable_storage"],
  approval_store: ["approval_lookup", "actor_binding", "immutable_decision"],
  audit_sink: ["append_only", "durable_write", "correlation_id"],
  provider_registry: ["trusted_registration", "capability_attestation", "revocation_check"],
};

function adapter(dependency: RuntimeDependencyId): RuntimeDependencyProbe {
  const attestation: RuntimeDependencyAttestation = {
    dependency,
    implementationId: `host:${dependency}:test`,
    environment: "staging",
    evidenceRef: `evidence://${dependency}/test-run-001`,
    verifiedAt: new Date(NOW - 60_000).toISOString(),
    expiresAt: new Date(NOW + 60_000).toISOString(),
    capabilities: capabilities[dependency],
  };
  return {
    attest: async () => attestation,
    healthCheck: async () => ({ healthy: true }),
  };
}

function completeDependencies(): TrustedRuntimeDependencies {
  return {
    identity: adapter("identity"),
    grant_verifier: adapter("grant_verifier"),
    nonce_store: adapter("nonce_store"),
    approval_store: adapter("approval_store"),
    audit_sink: adapter("audit_sink"),
    provider_registry: adapter("provider_registry"),
  };
}

const options = { environment: "staging" as const, now: () => NOW };

test("marks a complete, attested host dependency set ready for review only", async () => {
  const result = await assessTrustedRuntimeProvision(completeDependencies(), options);
  assert.equal(result.status, "ready_for_review");
  assert.equal(result.items.length, 6);
  assert.equal(result.productionActivationAllowed, false);
});

test("blocks when any required dependency is absent", async () => {
  const dependencies = completeDependencies();
  const result = await assessTrustedRuntimeProvision(
    { ...dependencies, audit_sink: undefined },
    options,
  );
  assert.equal(result.status, "blocked");
  assert.equal(result.productionActivationAllowed, false);
  assert.ok(result.blockers.some((item) => item.includes("audit_sink")));
});

test("blocks expired attestations and missing security capabilities", async () => {
  const dependencies = completeDependencies();
  dependencies.nonce_store = {
    attest: async () => ({
      ...await adapter("nonce_store").attest(),
      expiresAt: new Date(NOW - 1).toISOString(),
      capabilities: ["atomic_consume"],
    }),
    healthCheck: async () => ({ healthy: true }),
  };
  const result = await assessTrustedRuntimeProvision(dependencies, options);
  assert.equal(result.status, "blocked");
  const nonce = result.items.find((item) => item.dependency === "nonce_store");
  assert.equal(nonce?.ready, false);
  assert.ok(nonce?.reasons.length);
});

test("blocks unhealthy adapters and mismatched environments", async () => {
  const dependencies = completeDependencies();
  dependencies.identity = {
    attest: async () => ({
      ...await adapter("identity").attest(),
      environment: "development",
    }),
    healthCheck: async () => ({ healthy: false, detail: "identity provider offline" }),
  };
  const result = await assessTrustedRuntimeProvision(dependencies, options);
  assert.equal(result.status, "blocked");
  assert.equal(result.items.find((item) => item.dependency === "identity")?.ready, false);
});

test("fails closed on probe timeout", async () => {
  const dependencies = completeDependencies();
  dependencies.audit_sink = {
    attest: async () => new Promise(() => undefined),
    healthCheck: async () => ({ healthy: true }),
  };
  const result = await assessTrustedRuntimeProvision(dependencies, {
    ...options,
    timeoutMs: 5,
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.items.find((item) => item.dependency === "audit_sink")?.ready, false);
});
