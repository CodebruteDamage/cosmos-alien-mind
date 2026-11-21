import { createHash } from "node:crypto";

export const FAILURE_CODES = Object.freeze({
  TARGET_UNAVAILABLE: "INS-D001",
  ACCESS_DENIED: "INS-D002",
  SCOPE_INVALID: "INS-D003",
  DISCOVERY_INCOMPLETE: "INS-D004",
  EVIDENCE_MISSING: "INS-D005",
  SOURCE_UNTRUSTED: "INS-D006",
  DISCOVERY_TIMEOUT: "INS-D007",
  DISCOVERY_EXECUTOR_MISSING: "INS-D008",
  CONTRACT_INVALID: "INS-D009",
  GOVERNANCE_UNAVAILABLE: "INS-D010",
});

const PROFILES = new Set(["architecture","code","configuration","integration","defensive_security","performance","governance","readiness","comprehensive"]);

function failure(code, message, details = {}) {
  return { ok: false, code, message, details };
}

function normalizeRelativePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 1024) return null;
  if (value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/.test(value)) return null;
  const parts = value.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) return null;
  return parts.join("/");
}

function validateRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) return "Request must be an object.";
  if (request.contract_version !== "1.0" || typeof request.inspection_id !== "string" || !request.inspection_id.trim()) return "Invalid contract version or inspection ID.";
  if (!request.target || !["repository","application","engine","workflow","host","integration","configuration"].includes(request.target.type) || typeof request.target.identifier !== "string" || !request.target.identifier.trim()) return "Invalid target.";
  if (!PROFILES.has(request.profile)) return "Invalid inspection profile.";
  if (!request.scope || request.scope.mode !== "READ_ONLY" || !Array.isArray(request.scope.include) || request.scope.include.length === 0) return "A non-empty READ_ONLY scope is required.";
  if (request.scope.include.length > 500 || (request.scope.exclude ?? []).length > 500) return "Scope exceeds the maximum number of paths.";
  const include = request.scope.include.map(normalizeRelativePath);
  const exclude = (request.scope.exclude ?? []).map(normalizeRelativePath);
  if (include.some((x) => !x) || exclude.some((x) => !x)) return "Scope contains an unsafe or invalid relative path.";
  if (new Set(include).size !== include.length || new Set(exclude).size !== exclude.length) return "Scope contains duplicate paths.";
  if (typeof request.authorization_ref !== "string" || !request.authorization_ref.trim()) return "Authorization reference is required.";
  return null;
}

function isInScope(path, include, exclude) {
  const matches = (candidate, root) => candidate === root || candidate.startsWith(root.endsWith("/") ? root : root + "/");
  return include.some((root) => matches(path, root)) && !exclude.some((root) => matches(path, root));
}

export async function runRepositoryDiscovery({ request, authorize, adapter, timeoutMs = 15000, maxFiles = 2000, now = () => new Date() } = {}) {
  const invalid = validateRequest(request);
  if (invalid) return failure(FAILURE_CODES.CONTRACT_INVALID, invalid);
  if (typeof authorize !== "function") return failure(FAILURE_CODES.GOVERNANCE_UNAVAILABLE, "Authorization verifier is unavailable.");
  if (!adapter || typeof adapter.listFiles !== "function") return failure(FAILURE_CODES.DISCOVERY_EXECUTOR_MISSING, "Read-only repository adapter is unavailable.");

  const include = request.scope.include.map(normalizeRelativePath);
  const exclude = (request.scope.exclude ?? []).map(normalizeRelativePath);
  let grant;
  try {
    grant = await authorize({ authorizationRef: request.authorization_ref, target: request.target, scope: request.scope, profile: request.profile });
  } catch {
    return failure(FAILURE_CODES.GOVERNANCE_UNAVAILABLE, "Authorization verification failed.");
  }
  if (!grant || grant.authorized !== true) return failure(FAILURE_CODES.ACCESS_DENIED, "Inspection was not authorized.");
  if (grant.target?.type !== request.target.type || grant.target?.identifier !== request.target.identifier) return failure(FAILURE_CODES.ACCESS_DENIED, "Authorization target does not match the requested target.");
  const grantedInclude = Array.isArray(grant.include) ? grant.include.map(normalizeRelativePath) : [];
  if (grantedInclude.length !== include.length || include.some((p) => !grantedInclude.includes(p))) return failure(FAILURE_CODES.ACCESS_DENIED, "Authorization scope does not cover the requested scope.");
  if (grant.expiresAt && Date.parse(grant.expiresAt) <= now().getTime()) return failure(FAILURE_CODES.ACCESS_DENIED, "Authorization has expired.");

  let timer;
  try {
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("INSPECTOR_TIMEOUT")), timeoutMs); });
    const entries = await Promise.race([adapter.listFiles({ target: request.target, include, exclude, mode: "READ_ONLY", maxFiles }), timeout]);
    if (!Array.isArray(entries)) return failure(FAILURE_CODES.SOURCE_UNTRUSTED, "Repository adapter returned an invalid inventory.");
    if (entries.length > maxFiles) return failure(FAILURE_CODES.DISCOVERY_INCOMPLETE, "Repository inventory exceeded the configured file limit.", { maxFiles });
    const seen = new Set();
    const inventory = [];
    for (const entry of entries) {
      const path = normalizeRelativePath(entry?.path);
      if (!path || !isInScope(path, include, exclude) || seen.has(path) || typeof entry.content !== "string") {
        return failure(FAILURE_CODES.SOURCE_UNTRUSTED, "Adapter returned an unsafe, duplicate, out-of-scope, or unreadable entry.");
      }
      seen.add(path);
      const digest = createHash("sha256").update(entry.content, "utf8").digest("hex");
      inventory.push({ path, sha256: digest, bytes: Buffer.byteLength(entry.content, "utf8") });
    }
    inventory.sort((a, b) => a.path.localeCompare(b.path));
    const completedAt = now().toISOString();
    return { ok: true, inspectionId: request.inspection_id, target: request.target, profile: request.profile, mode: "READ_ONLY", startedAt: null, completedAt, discoveredCount: inventory.length, inventory, evidence: { algorithm: "sha256", generatedAt: completedAt }, limitations: ["File content is not included in the result.", "This core does not independently verify Git commit signatures or remote repository identity."] };
  } catch (error) {
    if (error instanceof Error && error.message === "INSPECTOR_TIMEOUT") return failure(FAILURE_CODES.DISCOVERY_TIMEOUT, "Repository discovery exceeded its time limit.", { timeoutMs });
    return failure(FAILURE_CODES.TARGET_UNAVAILABLE, "Repository discovery failed; target state is unverified.");
  } finally {
    if (timer) clearTimeout(timer);
  }
}
