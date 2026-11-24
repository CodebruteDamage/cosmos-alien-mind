const STATUSES = new Set(["success", "failure", "cancelled", "skipped", "in_progress", "queued", "unknown"]);
const SEVERITY = Object.freeze({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 });

function validText(value, max = 256) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return "Snapshot must be an object.";
  if (snapshot.contractVersion !== "1.0") return "Unsupported snapshot contract version.";
  if (!Array.isArray(snapshot.repositories) || snapshot.repositories.length < 1 || snapshot.repositories.length > 100) return "Repositories must contain 1–100 entries.";
  const seen = new Set();
  for (const repo of snapshot.repositories) {
    if (!validText(repo?.name, 200) || !validText(repo?.defaultBranch, 200) || !Array.isArray(repo.branches) || !Array.isArray(repo.workflows)) return "Invalid repository record.";
    if (seen.has(repo.name.toLowerCase())) return "Duplicate repository name.";
    seen.add(repo.name.toLowerCase());
    const branchNames = new Set();
    for (const branch of repo.branches) {
      if (!validText(branch?.name, 200) || typeof branch.protected !== "boolean") return "Invalid branch record.";
      if (branchNames.has(branch.name)) return "Duplicate branch name.";
      branchNames.add(branch.name);
    }
    if (!branchNames.has(repo.defaultBranch)) return "Default branch missing from branch inventory.";
    for (const workflow of repo.workflows) {
      if (!validText(workflow?.name, 200) || !STATUSES.has(workflow.status)) return "Invalid workflow status record.";
    }
  }
  return null;
}

function finding(id, severity, category, repository, subject, evidence, recommendation) {
  return { id, severity, category, repository, subject, evidence, recommendation, action: "RECOMMENDATION_ONLY", requiresHumanApproval: true };
}

/**
 * Creates a deterministic, read-only organization plan from a caller-supplied
 * GitHub inventory snapshot. It never writes to GitHub or infers that a branch
 * is safe to delete, merge, rename, or archive.
 */
export function buildRepositoryOrganizationPlan(snapshot) {
  const invalid = validateSnapshot(snapshot);
  if (invalid) return { ok: false, code: "INS-ORG-001", message: invalid, disposition: "FAILED" };

  const findings = [];
  const repositorySummaries = [];
  for (const repo of [...snapshot.repositories].sort((a, b) => a.name.localeCompare(b.name))) {
    const defaultBranch = repo.branches.find((branch) => branch.name === repo.defaultBranch);
    if (!defaultBranch.protected) {
      findings.push(finding(
        `INS-ORG-${findings.length + 1}`, "HIGH", "DEFAULT_BRANCH_UNPROTECTED", repo.name,
        repo.defaultBranch, "GitHub inventory reports protected=false for the default branch.",
        "Review branch rules and require CI/status checks before accepting integration changes."
      ));
    }
    for (const branch of repo.branches.filter((item) => item.name !== repo.defaultBranch).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!branch.protected) {
        findings.push(finding(
          `INS-ORG-${findings.length + 1}`, "MEDIUM", "FEATURE_BRANCH_UNPROTECTED", repo.name,
          branch.name, "GitHub inventory reports protected=false for this branch.",
          "Assess whether this branch is active or integration-critical; apply suitable branch rules if needed."
        ));
      }
    }
    for (const workflow of repo.workflows.filter((item) => ["failure", "cancelled"].includes(item.status)).sort((a, b) => a.name.localeCompare(b.name))) {
      findings.push(finding(
        `INS-ORG-${findings.length + 1}`, workflow.status === "failure" ? "HIGH" : "MEDIUM",
        "WORKFLOW_NOT_GREEN", repo.name, workflow.name,
        `Latest supplied workflow status is ${workflow.status}.`,
        "Inspect the failing run and its logs; do not treat cancellation as a code failure."
      ));
    }
    const branchesWithoutProtection = repo.branches.filter((item) => !item.protected).length;
    repositorySummaries.push({
      name: repo.name,
      defaultBranch: repo.defaultBranch,
      branchCount: repo.branches.length,
      unprotectedBranchCount: branchesWithoutProtection,
      workflowCount: repo.workflows.length,
      failingWorkflowCount: repo.workflows.filter((item) => item.status === "failure").length
    });
  }
  const priority = (a, b) => SEVERITY[a.severity] - SEVERITY[b.severity]
    || a.repository.localeCompare(b.repository) || a.subject.localeCompare(b.subject);
  findings.sort(priority);
  findings.forEach((item, index) => { item.id = `INS-ORG-${String(index + 1).padStart(3, "0")}`; });
  return {
    ok: true,
    contractVersion: "1.0",
    mode: "READ_ONLY",
    generatedAt: snapshot.generatedAt ?? null,
    source: snapshot.source ?? { kind: "caller_supplied_snapshot", authenticity: "UNVERIFIED" },
    repositoryCount: repositorySummaries.length,
    branchCount: repositorySummaries.reduce((sum, repo) => sum + repo.branchCount, 0),
    repositorySummaries,
    findings,
    disposition: findings.some((item) => item.severity === "CRITICAL" || item.severity === "HIGH") ? "REVIEW_REQUIRED" : findings.length ? "REVIEW_RECOMMENDED" : "NO_FINDINGS",
    constraints: [
      "Input is a caller-supplied snapshot; this module does not connect to GitHub.",
      "A clean inventory does not prove source correctness, runtime health, or deployment readiness.",
      "No branch is automatically deleted, renamed, merged, archived, or modified.",
      "WARP GATE remains the authorization authority for any future write-capable adapter."
    ]
  };
}
