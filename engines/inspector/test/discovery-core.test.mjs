import test from "node:test";
import assert from "node:assert/strict";
import { runRepositoryDiscovery, FAILURE_CODES } from "../src/discovery-core.mjs";

const request = (overrides = {}) => ({
  contract_version: "1.0", inspection_id: "test-001",
  target: { type: "repository", identifier: "owner/repo" }, profile: "code",
  scope: { include: ["src"], exclude: ["src/private"], mode: "READ_ONLY" },
  authorization_ref: "auth-test", ...overrides,
});
const authorize = async ({ target, scope }) => ({ authorized: true, target, include: scope.include, expiresAt: "2099-01-01T00:00:00.000Z" });
const adapter = { listFiles: async () => [{ path: "src/index.js", content: "export const ok = true;" }] };

test("discovers only in-scope files and returns content hashes, not content", async () => {
  const result = await runRepositoryDiscovery({ request: request(), authorize, adapter });
  assert.equal(result.ok, true);
  assert.equal(result.discoveredCount, 1);
  assert.match(result.inventory[0].sha256, /^[a-f0-9]{64}$/);
  assert.equal("content" in result.inventory[0], false);
});

test("rejects traversal paths before authorization", async () => {
  const result = await runRepositoryDiscovery({ request: request({ scope: { include: ["../secrets"], mode: "READ_ONLY" } }), authorize, adapter });
  assert.equal(result.code, FAILURE_CODES.CONTRACT_INVALID);
});

test("rejects missing authorization verifier", async () => {
  const result = await runRepositoryDiscovery({ request: request(), adapter });
  assert.equal(result.code, FAILURE_CODES.GOVERNANCE_UNAVAILABLE);
});

test("rejects unauthorized requests", async () => {
  const result = await runRepositoryDiscovery({ request: request(), authorize: async () => ({ authorized: false }), adapter });
  assert.equal(result.code, FAILURE_CODES.ACCESS_DENIED);
});

test("rejects authorization for a different target", async () => {
  const result = await runRepositoryDiscovery({ request: request(), authorize: async () => ({ authorized: true, target: { type: "repository", identifier: "other/repo" }, include: ["src"] }), adapter });
  assert.equal(result.code, FAILURE_CODES.ACCESS_DENIED);
});

test("rejects adapter entries outside the authorized scope", async () => {
  const result = await runRepositoryDiscovery({ request: request(), authorize, adapter: { listFiles: async () => [{ path: "docs/private.md", content: "x" }] } });
  assert.equal(result.code, FAILURE_CODES.SOURCE_UNTRUSTED);
});

test("rejects expired authorization", async () => {
  const result = await runRepositoryDiscovery({ request: request(), authorize: async ({ target, scope }) => ({ authorized: true, target, include: scope.include, expiresAt: "2000-01-01T00:00:00.000Z" }), adapter });
  assert.equal(result.code, FAILURE_CODES.ACCESS_DENIED);
});

test("returns a timeout failure", async () => {
  const result = await runRepositoryDiscovery({ request: request(), authorize, adapter: { listFiles: () => new Promise(() => {}) }, timeoutMs: 5 });
  assert.equal(result.code, FAILURE_CODES.DISCOVERY_TIMEOUT);
});

test("rejects oversized inventories", async () => {
  const result = await runRepositoryDiscovery({ request: request(), authorize, adapter: { listFiles: async () => [{ path: "src/a.js", content: "a" }, { path: "src/b.js", content: "b" }] }, maxFiles: 1 });
  assert.equal(result.code, FAILURE_CODES.DISCOVERY_INCOMPLETE);
});
