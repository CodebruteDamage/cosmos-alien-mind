import test from "node:test";
import assert from "node:assert/strict";
import {
  CosmosRequestEnvelopeSchema,
  CosmosApiErrorSchema,
} from "../../lib/cosmos/api-contracts";
import {
  authenticateRequest,
  principalMatchesTenant,
  type AuthenticatedPrincipal,
  type IdentityProvider,
} from "../../lib/cosmos/identity";

const requestEnvelope = {
  requestId: "11111111-1111-4111-8111-111111111111",
  correlationId: "22222222-2222-4222-8222-222222222222",
  actorId: "user-01",
  tenantId: "tenant-a",
  sourceModule: "OMNIBOARD",
  targetModule: "API",
  operation: "conversation.read",
  scope: ["conversation:read"],
  contractVersion: "1.0.0",
  requestedAt: "2026-11-21T12:00:00.000Z",
};

const validPrincipal: AuthenticatedPrincipal = {
  subject: "user-01",
  tenantId: "tenant-a",
  issuer: "https://identity.example.test",
  roles: ["user"],
  scopes: ["conversation:read"],
  issuedAt: "2026-11-21T11:00:00.000Z",
  expiresAt: "2026-11-21T13:00:00.000Z",
  authorizationRef: "authz-test-01",
};

const request = () => new Request("https://cosmos.example.test/api");

test("accepts a valid versioned COSMOS request envelope", () => {
  assert.equal(CosmosRequestEnvelopeSchema.safeParse(requestEnvelope).success, true);
});

test("rejects unsupported version syntax and unknown envelope fields", () => {
  assert.equal(CosmosRequestEnvelopeSchema.safeParse({
    ...requestEnvelope,
    contractVersion: "v1",
  }).success, false);
  assert.equal(CosmosRequestEnvelopeSchema.safeParse({
    ...requestEnvelope,
    unexpected: true,
  }).success, false);
});

test("validates structured API errors", () => {
  assert.equal(CosmosApiErrorSchema.safeParse({
    error: { code: "UNAUTHORIZED", message: "Authentication required" },
  }).success, true);
  assert.equal(CosmosApiErrorSchema.safeParse({ error: { code: "", message: "" } }).success, false);
});

test("fails closed when no identity provider is configured", async () => {
  assert.deepEqual(await authenticateRequest(request()), {
    ok: false,
    reason: "IDENTITY_PROVIDER_NOT_CONFIGURED",
  });
});

test("rejects provider exceptions", async () => {
  const provider: IdentityProvider = { verifyRequest: async () => { throw new Error("invalid"); } };
  assert.deepEqual(await authenticateRequest(request(), provider), {
    ok: false,
    reason: "CREDENTIAL_REJECTED",
  });
});

test("rejects malformed identity claims", async () => {
  const provider: IdentityProvider = { verifyRequest: async () => ({ subject: "only" }) };
  assert.deepEqual(await authenticateRequest(request(), provider), {
    ok: false,
    reason: "INVALID_PRINCIPAL",
  });
});

test("rejects expired principals", async () => {
  const provider: IdentityProvider = {
    verifyRequest: async () => ({ ...validPrincipal, expiresAt: "2026-11-21T11:59:59.000Z" }),
  };
  assert.deepEqual(await authenticateRequest(request(), provider, Date.parse("2026-11-21T12:00:00.000Z")), {
    ok: false,
    reason: "PRINCIPAL_EXPIRED",
  });
});

test("accepts valid provider-verified principal claims", async () => {
  const provider: IdentityProvider = { verifyRequest: async () => validPrincipal };
  const result = await authenticateRequest(request(), provider, Date.parse("2026-11-21T12:00:00.000Z"));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.principal.subject, "user-01");
});

test("prevents cross-tenant principal matching", () => {
  assert.equal(principalMatchesTenant(validPrincipal, "tenant-a"), true);
  assert.equal(principalMatchesTenant(validPrincipal, "tenant-b"), false);
});
