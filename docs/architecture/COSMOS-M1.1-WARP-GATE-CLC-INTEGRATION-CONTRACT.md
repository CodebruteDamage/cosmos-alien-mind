# COSMOS M1.1 — WARP GATE / CLC Integration Contract

Status: Draft implementation contract; review and runtime validation required.
Target: Alien Mind integration host.
Upstream source of truth: `CodebruteDamage/cosmos-cyber-sec-ops`, branches `feature/warp-gate-core-v1` and `feature/clc-lifecycle-foundation-b07`.

## 1. Repository boundary

Alien Mind consumes versioned interfaces from Cyber Sec Ops. It does not copy or absorb the security foundation wholesale. Upstream WARP GATE and CLC remain independently versioned and maintained.

## 2. Observed upstream interfaces

WARP GATE v1.1 exposes a structured authorization result containing:
- decision: `ALLOW`, `DENY`, `REQUIRE_APPROVAL`, or `BLOCKED`
- reason
- decision record with request/execution identifiers, policy version, principal and tenant context, optional grant identifier, and decision timestamp
- optional short-lived execution grant

WARP GATE authorizes requests and issues grants; it does not execute operations. The executor must independently verify and consume a grant.

CLC B07 exposes a lifecycle coordinator with an injected `LifecycleAuthorizer`. The current authorizer contract returns a boolean. CLC fails closed unless the result is exactly `True`. The coordinator currently authorizes `advance`; lifecycle `create` delegates directly to the store and does not call the authorizer.

## 3. Required adapter boundary

Implement an Alien Mind-owned adapter that:
1. Builds a WARP GATE request from authenticated server-side principal context and a lifecycle transition intent.
2. Calls the WARP GATE authorization interface.
3. Maps only an explicit `ALLOW` decision to an approved CLC transition.
4. Maps `DENY`, `BLOCKED`, missing results, malformed results, timeouts, and dependency failures to denial.
5. Maps `REQUIRE_APPROVAL` to a pending approval outcome; it must not be treated as allow.
6. Preserves request ID, execution ID, tenant ID, principal ID, policy version, decision reason, grant ID (when present), and trace/correlation ID in audit records.
7. Never logs credentials, bearer tokens, or execution-grant token values.

## 4. Lifecycle authorization rules

- Lifecycle creation must be authorized before a lifecycle record is persisted.
- Every lifecycle transition must be authorized before state mutation.
- Tenant and subject identity must come from trusted authenticated context, never from untrusted client-supplied fields.
- A grant is not permission to execute arbitrary tools. It is scoped to the exact capability, action, execution, tenant, and target scope.
- CLC remains a state coordinator and must not execute capabilities.
- Approval must be separately verified and bound to the exact requested operation.

## 5. Decision mapping

| WARP GATE result | Adapter result | CLC mutation |
|---|---|---|
| ALLOW with valid decision record | Authorized | Permitted after all bindings are checked |
| REQUIRE_APPROVAL | Approval pending | No mutation |
| DENY | Denied | No mutation |
| BLOCKED | Denied / unavailable | No mutation |
| Missing, malformed, timeout, exception | Denied / unavailable | No mutation |

The adapter must not infer authorization from a truthy value, HTTP success, or presence of a grant string alone.

## 6. Audit and evidence requirements

Each authorization attempt and lifecycle mutation must be correlatable by immutable request and trace identifiers. Audit events should include the decision, reason, actor/principal, tenant, lifecycle ID, from/to stage, policy version, evidence references, timestamp, and resulting lifecycle version. Secret material must be excluded.

Evidence references are identifiers, not proof of authenticity. Production validation must resolve them against the trusted evidence store and verify tenant ownership and integrity.

## 7. Required tests

- Explicit ALLOW permits the requested transition only.
- REQUIRE_APPROVAL never mutates lifecycle state without separately verified approval.
- DENY and BLOCKED never mutate state.
- Missing, malformed, timed-out, or failing WARP GATE dependency fails closed.
- Cross-tenant and cross-subject requests are rejected.
- Lifecycle creation requires authorization.
- Stage skipping, stale versions, and invalid blocked/resume transitions are rejected.
- Audit records preserve correlation and decision metadata without secrets.
- No executor or tool handler is invoked by the adapter or CLC.

## 8. Non-goals and release gates

This contract does not authorize production deployment, production database migration, remote shell execution, unrestricted agent autonomy, or merging either repository. It does not certify L4 readiness.

Before implementation can be considered complete:
1. Adapter implementation and tests must exist on an isolated branch.
2. Upstream WARP GATE and CLC tests must pass on their exact source SHAs.
3. Integration tests must pass in the target runtime.
4. Tenant isolation, approval binding, audit failure behavior, and grant verification must be demonstrated.
5. A reviewer must inspect the diff and evidence before merge approval.
