# COSMOS M1.3 — Runtime Wiring, Tenant Isolation, and Integration Validation

Status: Approved to begin; implementation and runtime certification pending.
Base: M1.2 branch head `441660c26b023a450b881fea6df9d838b44bc90d`.
Branch: `integration/m1.3-runtime-wiring`.

## 1. Objective

Move the M1.2 application-side contract into a testable runtime integration without weakening the repository boundary between Alien Mind and Cyber Sec Ops.

## 2. Verified M1.2 baseline

The M1.2 GitHub Actions run for commit `441660c26b023a450b881fea6df9d838b44bc90d` completed successfully:
- dependency installation: success
- TypeScript typecheck: success
- WARP GATE adapter contract tests: success

This validates the current TypeScript contract tests only. It does not validate a live WARP GATE transport, real grant verification, CLC upstream integration, database persistence, authentication, tenant isolation, or production behavior.

## 3. Runtime work packages

### M1.3-A — Trusted identity boundary
- Define a server-only authenticated principal interface.
- Derive tenant and subject identifiers from verified server-side identity.
- Reject missing, malformed, or untrusted identity context.
- Do not accept tenant or subject identity from request JSON as authority.

### M1.3-B — WARP GATE transport
- Define a server-only transport implementation for the upstream WARP GATE authorization contract.
- Validate response schema and request/decision binding.
- Implement grant verification and single-use consumption using the upstream verifier; do not invent cryptography or accept opaque grants without verification.
- Fail closed on timeout, replay, malformed response, verifier failure, and upstream unavailability.
- Never expose grant tokens or credentials to browser/client code or logs.

### M1.3-C — CLC runtime adapter
- Map authorized lifecycle create/advance operations to the upstream CLC coordinator contract.
- Preserve lifecycle state rules and optimistic concurrency.
- Ensure creation and every transition are authorized before persistence.
- Keep CLC state coordination separate from capability execution.

### M1.3-D — Tenant-scoped persistence
- Define tenant-scoped repository methods and database constraints.
- Ensure every read, create, update, and lookup is scoped by trusted tenant context.
- Add cross-tenant isolation tests.
- Do not apply database migrations to a live environment in this milestone.

### M1.3-E — Audit and traceability
- Record request/trace IDs, principal, tenant, lifecycle, decision, policy version, reason, timestamp, and lifecycle version.
- Do not record secrets, credentials, bearer tokens, or raw grant values.
- Define fail-closed behavior for mandatory audit-write failure.

## 4. Mandatory validation

1. Authenticated identity required.
2. Tenant identity cannot be overridden by client payload.
3. Explicit ALLOW plus valid, scoped, unexpired, single-use grant is required.
4. REQUIRE_APPROVAL, DENY, BLOCKED, malformed responses, and dependency failures do not mutate state.
5. Cross-tenant and cross-subject reads/writes are rejected.
6. Lifecycle create is authorized before persistence.
7. Lifecycle transitions enforce expected version and valid state progression.
8. Audit events correlate to the authorization decision without exposing secrets.
9. No lifecycle component invokes an arbitrary executor or remote shell.
10. Unit, contract, integration, and build checks pass in CI.

## 5. Release gates

- M1.3 code remains on this isolated branch.
- No production database migration, production deployment, branch-protection changes, or merge is included.
- Upstream WARP GATE and CLC source revisions must be pinned and their actual interfaces re-inspected before writing transport bindings.
- A live WARP GATE endpoint and a vetted grant verifier must be provided through secure server configuration before runtime authorization can be claimed.
- Completion requires a passing CI run and review of the complete diff.
- A passing mock-based contract test is not evidence of live integration or L4 certification.

## 6. Current limitations

The existing Alien Mind README documents that authentication and per-user data isolation are not implemented. The existing conversation endpoints are not tenant-scoped. M1.3 must not route production conversation traffic through the lifecycle adapter or claim the application is multi-tenant safe until those separate gaps are closed.
