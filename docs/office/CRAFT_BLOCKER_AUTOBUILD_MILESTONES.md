# COSMOS MAXX + CRAFT — Blocker Auto-Build Milestones v1.0

Status: M2/M3/M4 interface and proposal prototype committed; live ingestion, persistent storage, policy enforcement, and execution remain pending.
Repository: CodebruteDamage/cosmos-alien-mind
Working branch: feature/cosmos-office-maxx-workforce-live-v1

## Mission
Build MAXX as the evidence-led multi-analyzer and decision layer. Add CRAFT as its blocker detection, triage, remediation-planning, and verification workflow. Keep all execution behind server-side WARP GATE policy checks.

## Operating model
- MAXX analyzes evidence and produces findings, confidence rationale, comparisons, and recommendations.
- CRAFT owns blocker lifecycle: Detect → Classify → Trace → Propose → Authorize → Resolve → Verify → Record.
- A recommendation, score, registry entry, or UI control never grants execution permission.
- Default mode is read-only. Automated analysis and plan generation may proceed on authorized inputs.
- File writes, dependency changes, deployments, destructive operations, external side effects, and security-sensitive changes require scoped authorization and applicable human approval.
- No browser-held secrets or shared service token in client code.
- Never mark a blocker resolved until independent verification evidence is recorded.

## Milestones

### M0 — Baseline and restore point
- Inspect repository, branch, PR, CI, deployment target, and existing implementation.
- Preserve existing working UI and root application.
- Record known blockers and baseline commit.
- Exit: evidence-backed baseline and isolated feature branch.

### M1 — Contracts and lifecycle
- Versioned schemas for analyzer manifests/results, evidence references, worker events, blockers, and remediation plans.
- Distinguish observations, inferences, recommendations, assumptions, and evidence.
- Define bounded states and terminal outcomes.
- Exit: schemas type-check; invalid payloads reject; demo fixtures explicitly labeled.

### M2 — MAXX board
- Analyzer registry and board definitions.
- Evidence/provenance panel, confidence rationale, limitations, comparison, and decision summary.
- Missing evidence renders unknown, never a fabricated score.
- Current: read-only MAXX shell and versioned analysis/evidence contracts exist; analyzer registry remains disconnected and the score cards are explicitly illustrative.
- Exit: connect authenticated analyzer outputs and verify evidence lineage.

### M3 — CRAFT blocker desk
- Ingest build, lint, test, dependency, integration, and policy blockers from authorized sources.
- Deduplicate by stable fingerprint; preserve first-seen/last-seen and source snapshots.
- Classify severity/category and show causal evidence.
- Current: CRAFT blocker schema and MAXX analysis references added; read-only API and `/office` blocker desk show one clearly labeled historical CI fixture with evidence provenance. Live CI ingestion, deduplication, and persistence are not implemented.
- Exit: authenticated CI/analyzer ingestion, stable fingerprinting, and persistent blocker history.

### M4 — Remediation planner
- Generate bounded, reviewable plans with preconditions, expected changes, risk, rollback, and verification criteria.
- Separate plan generation from execution.
- Retry budget, timeout, idempotency key, and stop conditions are mandatory.
- Current: API generates a draft plan for the demo blocker with risk, expected evidence, rollback, and verification criteria. It is non-executable and not persisted; approval workflow is not implemented.
- Exit: persist plans, implement review/approval records, and test idempotency and stop conditions.

### M5 — WARP GATE enforcement
- Server-side actor, capability, target scope, action kind, risk, policy version, and approval evaluation.
- Deny by default; capability must be least-privilege and operation-specific.
- Record allow/deny, approver, policy decision, request digest, and correlation ID.
- Exit: tests prove unauthorized requests never reach execution adapters.

### M6 — Controlled execution adapters
- Add only explicitly allowlisted adapters (e.g. isolated branch file patch, CI rerun, preview deployment).
- No force-push, branch deletion, secret exposure, production deployment, or policy bypass.
- Require approval for consequential changes; preserve restore point and rollback route.
- Exit: adapter integration tests and audit trail pass.

### M7 — Verification and release
- Unit/schema tests, API authorization tests, integration tests, build/lint, accessibility, and browser smoke tests.
- Verify preview URL and deployment source commit.
- Release only after CI green, review approval, and deployment target confirmation.
- Exit: evidence-backed release report; no success claims based on command submission alone.

## Full-auto policy
Automation may autonomously inspect, classify, compare, draft plans, run read-only checks, and collect verification evidence within granted scope. It must pause for authorization when a step writes files, changes dependencies, alters repository settings, affects external systems, or carries elevated risk. Failed tests never authorize destructive fixes. Bounded retries only; stop on ambiguous ownership, missing evidence, policy denial, or unexpected diff.

## Current known blockers
- GitHub Actions lint failed because eslint.config.mjs imported extensionless eslint-config-next subpaths. The import paths have been corrected; rerun CI to verify.
- Vercel build produced /office and reached READY on a separate project, but logged an ESLint module-resolution error and CSS autoprefixer warning. Treat this deployment as a technical preview, not release evidence.
- The current CI run stopped at lint, so the CI production-build step was skipped.
- MAXX and Workforce Live remain demo/read-only; no live analyzer, worker telemetry, or CRAFT execution runtime is connected.

## Completion definition
A milestone is complete only when its acceptance criteria pass and the repository contains the evidence (tests, logs, commit, deployment metadata, and audit records). A UI label or deployment URL alone is not proof of operational capability.


## Latest implementation record
- CRAFT contracts now link blocker records to MAXX `analysisIds` and evidence references.
- `GET /api/office/craft` serves a clearly marked static fixture; `POST /api/office/craft` generates a non-executable draft proposal for a known fixture.
- COSMOS OFFICE includes a CRAFT Blocker Desk view with evidence details and a remediation proposal panel.
- No live CI ingestion, database persistence, WARP GATE decision endpoint, command runner, or repository mutation path was added.
