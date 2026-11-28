# M6 Governed Provisioning Integration v1

Status: isolated integration candidate; not merged, migrated, deployed, or L4/L5 certified.
Base: `cosmos/m6-l4-l5-orchestration-provision`
Integration branch: `cosmos/m6-governed-provisioning-integration-v1`
Accountable Task Owner: COSMAXX Integration & Execution Lead (logical role; trusted principal registration is still required)
Task Provider: COSMOS Build Commander
Execution Provider: GitHub source integration and GitHub Actions validation
Blocker Provider: CRAFT
Independent validation: C-INSPECTOR / 12 GAP Cycle
Authorization authority: WARP GATE

## Integrated source packages

- COSMAXX v1 contracts and recommendation-only runtime adapter.
- Automatic task ownership v1.1 with objective–subject alignment and capability checks.
- M03 WARP GATE grant contract with exact binding and fail-closed verification.
- M04 six-dependency trusted runtime readiness gate.
- Unit tests for ownership, optimizer validation, WARP GATE and provisioning readiness.
- M6-compatible CI workflow and lifecycle transition policy.
- Database migration contract for trusted owner/provider registries, task records, append-only events, WARP GATE decision references and a guarded dispatch outbox.

The source integrations are ported from PRs #11, #17, #18, #19, #20 and #21. PR #21's subject-first ownership policy supersedes the older category-only policy. The older PR #15 WARP GATE adapter is not copied as a second authorization path; M03's stronger binding contract is the canonical contract.

## Important limits

This integration does not provide trusted host implementations for identity attestation, grant signing/verification, atomic nonce consumption, approval persistence, durable audit, or provider registration. The Better Auth adapter on M6 is the current identity candidate, not a completed identity-provider ADR or a signed host attestation.

The migration creates the persistence structures but has not been applied. It does not insert owner/provider principals. No task may be marked OWNED or dispatched until a trusted owner and execution provider are registered, attested, active, and capability-compatible.

The dispatch outbox trigger requires an AUTHORIZED task and a current task-bound WARP GATE ALLOW record. The database cannot itself verify grant signatures; the trusted WARP GATE host must cryptographically verify the grant and atomically consume its nonce before the ALLOW record is written.

The lifecycle policy is a pure policy helper. Its boolean evidence flags are not authorization grants; production code must use trusted host receipts and atomic persistence.

## Deployment sequence

1. Review this integration PR and its CI results.
2. Resolve M01 identity-provider ADR and configure verified Better Auth production settings, tenant membership, email verification/recovery, and rate limits.
3. Implement and independently test the six M04 host dependencies.
4. Implement the M02 trusted owner and execution-provider registration/admin path; never accept self-attested model input as registry evidence.
5. Implement M03 WARP GATE host service, signature/issuer validation, canonical parameter digest, atomic nonce consumption, approval store, and durable decision audit.
6. Review the migration, back up the target Neon database, apply to staging first, and verify constraints/indexes/triggers and tenant isolation.
7. Implement M05 durable task writes, atomic state/event updates, queue claiming, idempotency, lease expiry, retries, cancellation and reconciliation.
8. Connect the M6 API/orchestrator to the registered identity, owner/provider registries, COSMAXX recommendations and verified WARP GATE port. Keep dispatch disabled until all required readiness checks pass.
9. Deploy a protected preview, run end-to-end cross-tenant, replay, expiry, denial, approval, timeout, concurrency and recovery tests.
10. Obtain independent C-INSPECTOR validation and explicit human approval before production migration, merge, deployment or activation.

## Rollback

Keep the integration branch isolated. Do not apply the migration to production as part of this PR. If staging validation fails, stop dispatch, preserve audit evidence, roll back the application deployment, and use a reviewed database rollback plan. Do not delete append-only evidence to make a failed test appear clean.

## Acceptance

- M6 branch remains unchanged.
- The new integration branch passes tests, typecheck, lint and production build.
- The ownership policy rejects missing objective/subject alignment and ambiguous providers.
- WARP GATE denies malformed, expired, mismatched or unverified grants.
- Provisioning readiness remains blocked when any required host dependency is missing or unhealthy.
- Outbox insertion is rejected unless task state is AUTHORIZED and a current task-bound ALLOW decision is recorded.
- No migration, credential provisioning, merge, deployment or production activation is performed by this change.
