import test from "node:test";
import assert from "node:assert/strict";
import {
  createBetterAuthIdentityProvider,
  type BetterAuthSessionSnapshot,
} from "../../lib/cosmos/identity-provider";

const snapshot: BetterAuthSessionSnapshot = {
  user: { id: "user-123" },
  session: {
    id: "session-456",
    createdAt: new Date("2026-11-21T10:00:00.000Z"),
    expiresAt: new Date("2026-11-28T10:00:00.000Z"),
    activeOrganizationId: "org-789",
  },
};

test("maps only a verified Better Auth session to a COSMOS principal", async () => {
  process.env.BETTER_AUTH_URL = "https://cosmos.example.test";
  const provider = createBetterAuthIdentityProvider(async () => snapshot);
  const claims = await provider.verifyRequest(new Request("https://cosmos.example.test/api"));
  assert.deepEqual(claims, {
    subject: "user-123",
    tenantId: "org-789",
    issuer: "https://cosmos.example.test",
    roles: ["authenticated"],
    scopes: [],
    issuedAt: "2026-11-21T10:00:00.000Z",
    expiresAt: "2026-11-28T10:00:00.000Z",
    authorizationRef: "session-456",
  });
});

test("rejects missing Better Auth sessions", async () => {
  const provider = createBetterAuthIdentityProvider(async () => null);
  await assert.rejects(
    provider.verifyRequest(new Request("https://cosmos.example.test/api")),
    /No valid Better Auth session/,
  );
});

test("rejects sessions without an active organization", async () => {
  const provider = createBetterAuthIdentityProvider(async () => ({
    ...snapshot,
    session: { ...snapshot.session, activeOrganizationId: null },
  }));
  await assert.rejects(
    provider.verifyRequest(new Request("https://cosmos.example.test/api")),
    /active organization is required/,
  );
});

test("does not derive tenant identity from request-supplied headers", async () => {
  process.env.BETTER_AUTH_URL = "https://cosmos.example.test";
  const provider = createBetterAuthIdentityProvider(async () => snapshot);
  const request = new Request("https://cosmos.example.test/api", {
    headers: { "x-tenant-id": "attacker-controlled-tenant" },
  });
  const claims = await provider.verifyRequest(request) as { tenantId: string };
  assert.equal(claims.tenantId, "org-789");
});
