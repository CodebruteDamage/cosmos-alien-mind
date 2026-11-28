import test from "node:test";
import assert from "node:assert/strict";
import {
  createNeonAuthIdentityProvider,
  type NeonAuthSessionSnapshot,
} from "../../lib/cosmos/identity-provider";

const snapshot: NeonAuthSessionSnapshot = {
  user: { id: "user-123" },
  session: {
    id: "session-456",
    createdAt: new Date("2026-11-21T10:00:00.000Z"),
    expiresAt: new Date("2026-11-28T10:00:00.000Z"),
    activeOrganizationId: "org-789",
  },
};

const authBaseUrl = "https://neon-auth.example.test/neondb/auth";

test("maps a Neon Auth-verified session and active membership to a COSMOS principal", async () => {
  const provider = createNeonAuthIdentityProvider(
    async () => snapshot,
    async () => ({ id: "member-123", organizationId: "org-789" }),
    authBaseUrl,
  );
  const claims = await provider.verifyRequest(
    new Request("https://cosmos.example.test/api"),
  );

  assert.deepEqual(claims, {
    subject: "user-123",
    tenantId: "org-789",
    issuer: "https://neon-auth.example.test",
    roles: ["authenticated"],
    scopes: [],
    issuedAt: "2026-11-21T10:00:00.000Z",
    expiresAt: "2026-11-28T10:00:00.000Z",
    authorizationRef: "session-456",
  });
});

test("rejects missing Neon Auth sessions", async () => {
  const provider = createNeonAuthIdentityProvider(
    async () => null,
    async () => ({ id: "member-123" }),
    authBaseUrl,
  );
  await assert.rejects(
    provider.verifyRequest(new Request("https://cosmos.example.test/api")),
    /No valid Neon Auth session/,
  );
});

test("rejects sessions without an active organization", async () => {
  const provider = createNeonAuthIdentityProvider(
    async () => ({
      ...snapshot,
      session: { ...snapshot.session, activeOrganizationId: null },
    }),
    async () => ({ id: "member-123" }),
    authBaseUrl,
  );
  await assert.rejects(
    provider.verifyRequest(new Request("https://cosmos.example.test/api")),
    /active organization is required/,
  );
});

test("rejects an active organization without current membership", async () => {
  const provider = createNeonAuthIdentityProvider(
    async () => snapshot,
    async () => null,
    authBaseUrl,
  );
  await assert.rejects(
    provider.verifyRequest(new Request("https://cosmos.example.test/api")),
    /Current organization membership is required/,
  );
});

test("does not derive tenant identity from request-supplied headers", async () => {
  const provider = createNeonAuthIdentityProvider(
    async () => snapshot,
    async () => ({ id: "member-123", organizationId: "org-789" }),
    authBaseUrl,
  );
  const request = new Request("https://cosmos.example.test/api", {
    headers: { "x-tenant-id": "attacker-controlled-tenant" },
  });
  const claims = await provider.verifyRequest(request) as { tenantId: string };
  assert.equal(claims.tenantId, "org-789");
});
