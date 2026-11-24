import test from "node:test";
import assert from "node:assert/strict";
import { discoverGitHubRepositories } from "./github-adapter.mjs";

function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}
test("reads only allowlisted repository metadata, branches and workflow runs", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, method: options.method, authorization: options.headers.Authorization });
    if (url.includes("/branches?")) return response([{ name: "main", protected: true, commit: { sha: "abc" } }]);
    if (url.includes("/actions/runs?")) return response({ workflow_runs: [{ id: 7, name: "CI", status: "completed", conclusion: "success", head_branch: "main", head_sha: "abc" }] });
    return response({ full_name: "owner/repo", default_branch: "main", visibility: "private" });
  };
  const result = await discoverGitHubRepositories({ token: "x".repeat(40), repositories: "owner/repo", fetchImpl });
  assert.equal(result.repositories.length, 1);
  assert.equal(result.repositories[0].branches[0].protectionStatus, "protected");
  assert.equal(result.repositories[0].workflows[0].status, "success");
  assert.ok(calls.every(call => call.method === "GET"));
  assert.ok(calls.every(call => call.authorization === `Bearer ${"x".repeat(40)}`));
});
test("rejects missing token and empty allowlist", async () => {
  await assert.rejects(() => discoverGitHubRepositories({ token: "", repositories: "owner/repo" }), /token is not configured/);
  await assert.rejects(() => discoverGitHubRepositories({ token: "x".repeat(40), repositories: "" }), /must list/);
});
test("rejects invalid allowlist entries before network access", async () => {
  let called = false;
  await assert.rejects(() => discoverGitHubRepositories({ token: "x".repeat(40), repositories: "../repo", fetchImpl: async () => { called = true; } }), /invalid owner\/repository/);
  assert.equal(called, false);
});
test("fails closed on GitHub authorization failure", async () => {
  await assert.rejects(() => discoverGitHubRepositories({
    token: "x".repeat(40), repositories: "owner/repo",
    fetchImpl: async () => response({}, 403)
  }), /authorization or rate limit/);
});
test("preserves missing protection metadata as unknown", async () => {
  const fetchImpl = async url => url.includes("/branches?")
    ? response([{ name: "main", commit: { sha: "abc" } }])
    : url.includes("/actions/runs?")
      ? response({ workflow_runs: [] })
      : response({ full_name: "owner/repo", default_branch: "main" });
  const result = await discoverGitHubRepositories({ token: "x".repeat(40), repositories: "owner/repo", fetchImpl });
  assert.equal(result.repositories[0].branches[0].protectionStatus, "unknown");
});
