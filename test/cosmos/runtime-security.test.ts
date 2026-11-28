import test from "node:test";
import assert from "node:assert/strict";
import { authenticateRequest, type IdentityProvider, type AuthenticatedPrincipal } from "../../lib/cosmos/identity";
import { authorizeProtectedOperation, type WarpGateProvider } from "../../lib/cosmos/authorization";

const principal: AuthenticatedPrincipal = {
  subject: "user-1",
  tenantId: "tenant-1",
  issuer: "https://identity.example.test",
  roles: ["authenticated"],
  scopes: [],
  issuedAt: "2026-11-28T00:00:00.000Z",
  expiresAt: "2026-11-29T00:00:00.000Z",
  authorizationRef: "session-1",
};
const request = new Request("https://cosmos.example.test/api");

test("identity fails closed without a trusted provider", async () => {
  assert.deepEqual(await authenticateRequest(request, undefined, Date.parse("2026-11-28T12:00:00.000Z")), {
    ok: false, reason: "IDENTITY_PROVIDER_NOT_CONFIGURED",
  });
});

test("identity rejects expired claims", async () => {
  const provider: IdentityProvider = { verifyRequest: async () => ({ ...principal, expiresAt: "2026-11-28T11:00:00.000Z" }) };
  assert.deepEqual(await authenticateRequest(request, provider, Date.parse("2026-11-28T12:00:00.000Z")), {
    ok: false, reason: "PRINCIPAL_EXPIRED",
  });
});

test("identity accepts trusted, valid claims", async () => {
  const provider: IdentityProvider = { verifyRequest: async () => principal };
  const result = await authenticateRequest(request, provider, Date.parse("2026-11-28T12:00:00.000Z"));
  assert.equal(result.ok, true);
});

test("protected operation fails closed when WARP GATE is absent", async () => {
  assert.deepEqual(await authorizeProtectedOperation(principal, "conversation.read"), {
    allow: false, reason: "WARP_GATE_NOT_CONFIGURED",
  });
});

test("protected operation rejects WARP GATE denial", async () => {
  const provider: WarpGateProvider = { authorize: async () => ({ allow: false, decisionId: "deny-1", reason: "POLICY_DENIED" }) };
  const result = await authorizeProtectedOperation(principal, "conversation.read", provider);
  assert.equal(result.allow, false);
  assert.equal(result.reason, "POLICY_DENIED");
});

test("protected operation requires a traceable WARP GATE allow decision", async () => {
  const provider: WarpGateProvider = { authorize: async () => ({ allow: true, decisionId: "allow-1", reason: "POLICY_ALLOWED" }) };
  const result = await authorizeProtectedOperation(principal, "conversation.create", provider);
  assert.equal(result.allow, true);
  assert.equal(result.decisionId, "allow-1");
});
