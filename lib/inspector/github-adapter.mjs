const API = "https://api.github.com";
const ACCEPT = "application/vnd.github+json";
const MAX_PAGES = 10;
const PER_PAGE = 100;

function parseAllowlist(value) {
  const items = String(value ?? "").split(",").map(x => x.trim()).filter(Boolean);
  if (!items.length || items.length > 20) throw new Error("COSMOS_INSPECTOR_REPOSITORIES must list 1–20 repositories.");
  const unique = [...new Set(items)];
  for (const item of unique) {
    const [owner, repository] = item.split("/");
    if (!/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(item) || owner === "." || owner === ".." || repository === "." || repository === "..") {
      throw new Error("Repository allowlist contains an invalid owner/repository identifier.");
    }
  }
  return unique;
}

async function githubJson(url, token, fetchImpl) {
  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: ACCEPT,
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "COSMOS-Inspector-ReadOnly"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    const status = response.status;
    if (status === 401 || status === 403) throw new Error(`GitHub authorization or rate limit response (${status}).`);
    if (status === 404) throw new Error("An allowlisted GitHub resource was not found or is not accessible.");
    throw new Error(`GitHub API request failed (${status}).`);
  }
  return response.json();
}

async function paged(url, token, fetchImpl) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const separator = url.includes("?") ? "&" : "?";
    const data = await githubJson(`${url}${separator}per_page=${PER_PAGE}&page=${page}`, token, fetchImpl);
    if (!Array.isArray(data)) throw new Error("GitHub returned an invalid collection.");
    all.push(...data);
    if (data.length < PER_PAGE) return all;
  }
  throw new Error("GitHub inventory exceeded the configured pagination safety limit.");
}

/**
 * Read-only adapter. It reads only explicitly allowlisted repositories,
 * branch metadata and recent workflow runs. It never reads file contents,
 * secrets, issues, pull-request bodies, or performs GitHub writes.
 */
export async function discoverGitHubRepositories({
  token = process.env.GITHUB_TOKEN,
  repositories = process.env.COSMOS_INSPECTOR_REPOSITORIES,
  fetchImpl = fetch
} = {}) {
  if (typeof token !== "string" || token.length < 20) throw new Error("GitHub read token is not configured.");
  const allowlist = parseAllowlist(repositories);
  const result = [];
  for (const fullName of allowlist) {
    const encoded = fullName.split("/").map(encodeURIComponent).join("/");
    const repo = await githubJson(`${API}/repos/${encoded}`, token, fetchImpl);
    if (repo.full_name?.toLowerCase() !== fullName.toLowerCase()) throw new Error("GitHub repository identity mismatch.");
    const [branches, runs] = await Promise.all([
      paged(`${API}/repos/${encoded}/branches`, token, fetchImpl),
      githubJson(`${API}/repos/${encoded}/actions/runs?per_page=30`, token, fetchImpl)
    ]);
    const workflowRuns = Array.isArray(runs.workflow_runs) ? runs.workflow_runs : [];
    result.push({
      name: repo.full_name,
      defaultBranch: repo.default_branch,
      visibility: repo.visibility ?? "unknown",
      branches: branches.map(item => ({
        name: item.name,
        protected: item.protected === true,
        protectionStatus: typeof item.protected === "boolean" ? (item.protected ? "protected" : "unprotected") : "unknown",
        commitSha: item.commit?.sha ?? null
      })),
      workflows: workflowRuns.map(run => ({
        name: run.name || run.path || "Unnamed workflow",
        status: run.status === "completed"
          ? (["success", "failure", "cancelled", "skipped"].includes(run.conclusion) ? run.conclusion : "unknown")
          : (["queued", "in_progress"].includes(run.status) ? run.status : "unknown"),
        runId: run.id,
        branch: run.head_branch ?? null,
        commitSha: run.head_sha ?? null,
        url: run.html_url ?? null,
        updatedAt: run.updated_at ?? null
      }))
    });
  }
  return {
    contractVersion: "1.0",
    generatedAt: new Date().toISOString(),
    source: { kind: "github-rest-api", apiVersion: "2022-11-28", authenticity: "authenticated-read", allowlist: [...allowlist] },
    repositories: result
  };
}
