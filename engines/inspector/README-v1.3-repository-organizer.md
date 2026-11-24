# COSMOS INSPECTOR v1.3 — Repository Organizer

## Purpose
Turn a verified repository/branch/workflow inventory into a deterministic organization review. This milestone adds a pure planning engine; it does not connect to GitHub or mutate repositories.

## Input contract
`buildRepositoryOrganizationPlan(snapshot)` accepts contractVersion `1.0` and 1–100 repository records. Each record contains a repository name, default branch, branch protection flags and workflow status records. The caller must supply a complete inventory. Source authenticity is not established by this module.

## Findings
- `DEFAULT_BRANCH_UNPROTECTED`: default branch is reported without protection.
- `FEATURE_BRANCH_UNPROTECTED`: non-default branch is reported without protection.
- `WORKFLOW_NOT_GREEN`: latest supplied workflow is failed or cancelled. Failure and cancellation have different severities and recommendations.

Findings are deterministic and sorted by severity, repository and subject. Every finding is recommendation-only and requires human approval.

## Safety boundary
READ_ONLY is enforced at the planner boundary. No GitHub write adapter exists. No branch is deleted, merged, renamed, archived, or rewritten. A future GitHub adapter must verify source completeness and provenance, bind identity to WARP GATE, use least-privilege read scopes, redact secrets, and emit append-only audit evidence. WARP GATE remains the only authority for write capabilities.

## Limitations
A caller-supplied snapshot can be incomplete or stale. The planner cannot establish source authenticity, branch ancestry, merge safety, code quality, runtime health, or deployment readiness. Those require separate evidence-backed checks.
