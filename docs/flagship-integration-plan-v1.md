# COSMOS Flagship Foundation — Integration Plan v1.0

Status: planning branch only. No feature branches merged, no production resources changed, and no runtime tests executed from this branch.

## Objective

Consolidate the existing COSMOS foundations into a reviewable integration path while preserving source history and existing working implementations. This plan does not certify production readiness or frontier-model parity.

## Evidence baseline (GitHub source review, 2026-11-22)

- `main` is the current integration baseline at the time this branch was created.
- Inspector validation branch `test/inspector-v1-2-validation` is 13 commits ahead of `main`, 0 behind. It contains contracts, discovery-core logic and CI tests. A real repository adapter, filesystem containment/symlink defenses, WARP GATE adapter and persistence are not yet demonstrated.
- API Security T2 branch `feat/cosmos-api-security-t2` is 24 commits ahead of `main`, 0 behind.
- Better Auth T3 branch `feat/cosmos-better-auth-t3` is 39 commits ahead of `main`, 0 behind, and includes the API security foundation plus Better Auth session/organization membership checks. Neon migrations and email verification/recovery delivery remain unverified.
- Webhook branch `feat/cosmos-webhook-gap-closure` is 47 commits ahead of `main`, 0 behind. It contains HMAC validation, registry, queue and authorization code. Its relationship to Better Auth T3 must be reconciled because those branches diverge. High-risk approval is not connected to a trusted approval service; WARP GATE integration, worker scheduling/deployment and database-enforced audit immutability remain open.
- Autonomous workflow runtime PR #4 targets `feat/live-data-swarm`, not `main`. Its source includes a literal backslash-n sequence in `lib/workflow-runtime.ts` after an error-event statement, which appears to be a TypeScript syntax defect and must be corrected and tested before integration. Its PR description also states that durable state, distributed locking, queues, tenant identity, scheduler, connector credentials and production integration tests are absent.
- The live swarm branch documents shared-token authentication and missing per-node identity/rate limiting. Do not broaden deployment until read access and telemetry privacy are reviewed.
- Prior CI evidence is branch-specific unit/contract testing, not proof of integrated production behavior. Re-run all gates after each consolidation step.

## Integration sequence

### P0 — Establish a controlled integration base
1. Keep `main` unchanged.
2. Use this branch as the isolated integration workspace.
3. Record branch SHAs and changed-file inventories before each integration.
4. Integrate one capability slice at a time through reviewed commits/PRs; do not merge unrelated feature branches wholesale.
5. Resolve package scripts, dependencies and lockfile consistency before accepting any code.

### P1 — Identity and governance
1. Treat Better Auth T3 as the candidate identity foundation, subject to full diff review and migration review.
2. Keep tenant and subject identity server-derived; reject caller-supplied tenant identity.
3. Implement WARP GATE as the independent authorization authority for capability, scope, risk and approval decisions.
4. Ensure policy evaluation fails closed and every decision has an audit reference.
5. Do not enable webhook high-risk actions until a trusted approval-service adapter is present.

### P2 — Inspector
1. Integrate Inspector contracts and pure discovery core after review.
2. Implement a read-only repository adapter with canonical-root containment, symlink escape protection, file-count/size/time budgets and deterministic fingerprints.
3. Require a WARP GATE grant bound to exact target, profile and scope, with expiry and revocation checks.
4. Persist signed/immutable evidence only after tenant ownership and retention controls are established.
5. Test denial, expiry, traversal, symlink, timeout, partial inventory and adapter failure cases.

### P3 — Workflow and PowerBoxx
1. Repair the workflow runtime syntax issue and add the missing lockfile/CI setup.
2. Integrate only registered, typed capabilities; never execute model-generated shell/code directly.
3. Require WARP GATE authorization before each step, bounded budgets, idempotency, kill switch and independently verified postconditions.
4. Keep destructive/high-impact actions disabled until a trusted human-approval adapter and reconciliation/rollback strategy exist.
5. Add durable state, locking, queue semantics and tenant isolation before production orchestration.

### P4 — Webhooks and event integrations
1. Reconcile webhook changes against Better Auth T3 at the file and migration level; do not assume branch compatibility.
2. Apply migrations only in a reviewed staging environment with backup and rollback plan.
3. Verify HMAC, replay protection, tenant binding, registry scope, queue leases and worker reauthorization.
4. Add trusted approval integration for high-risk operations and immutable audit guarantees.
5. Keep the webhook feature disabled by default until all required gates pass.

### P5 — Intelligence and knowledge
1. Add server-side model-provider adapters and model routing with secrets isolated from client bundles.
2. Add retrieval with source provenance, tenant filtering, freshness and evidence references.
3. Separate model-generated suggestions from authorized actions.
4. Evaluate factual grounding, abstention, prompt-injection resistance and cross-tenant isolation.

### P6 — Flagship assurance
Run an integrated suite across THINK, KNOW, ACT, GOVERN, ADAPT, COMPANION and EVOLVE. Proposed internal acceptance gates: at least 90/100 overall, at least 80/100 in every pillar, and automatic failure for any critical governance breach. These are COSMOS project criteria, not an external certification.

## Merge gates

- No unresolved high/critical security findings.
- CI: tests, lint, typecheck, production build and dependency/lockfile consistency all pass on the exact candidate SHA.
- Integration tests cover identity -> WARP GATE -> Inspector/workflow/webhook boundaries.
- Tenant isolation, authorization denial, audit trail and recovery behavior are verified.
- Migrations are reviewed and tested in staging; production migration requires separate explicit approval.
- Deployment is preview-only until a human reviews the exact candidate and evidence bundle.

## Current execution boundary

This branch contains only this plan document. No feature code was merged or modified. No database migration, secret, deployment, local workstation or Termux operation was performed.
