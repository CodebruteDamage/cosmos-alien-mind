# COSMOS Dual-Brain Implementation Slice v1.0

**Branch:** `integration/dual-brain-lifecycle-v1`  
**Target:** `CodebruteDamage/cosmos-alien-mind`  
**Status:** Adapter/coordinator foundation implemented; live model integration is not enabled.

## Implemented

- `lib/dual-brain/contracts.ts`: strict Zod schemas for role-specific requests, provenance-bearing context, structured claims, response envelopes and adapter contracts.
- `lib/dual-brain/coordinator.ts`: bounded parallel invocation of COSMOS Core and Alien Mind adapters, timeout cancellation, response validation, request/role correlation, explicit degraded mode and claim-level disagreement reporting.
- `tests/dual-brain.test.ts`: coverage for normal dual invocation, material disagreement, single-brain degradation, role/correlation mismatch, invalid input and timeout.
- `.github/workflows/dual-brain-validation.yml`: pull-request/push validation for TypeScript, lint and dual-brain tests.
- `package.json`: test and type-check scripts plus the `tsx` test runner.

## Runtime invariants

1. COSMOS Core remains the primary response owner.
2. Alien Mind is an independent analytical adapter, not a second system authority.
3. Two matching responses are not labeled verified consensus; the result explicitly sets `consensusClaim: false`.
4. A single available brain is reported as `degraded`, never as successful dual-brain completion.
5. Material opposing stances on the same claim ID produce `needs_review`; neither result is silently discarded.
6. The coordinator has no tool execution or authorization interface. Proposed actions remain suggestions and must pass the existing WARP GATE authorization boundary separately.
7. Context provenance is mandatory in the request contract. Untrusted context remains explicitly labeled.
8. Adapter exceptions, malformed responses, and correlation mismatches fail closed.

## Not yet implemented / release blockers

- No actual Alien Mind provider/runtime source was located in the audited repository branches.
- No live provider adapters or model credentials are configured.
- The repository's current default branch documents authentication and tenant isolation as unfinished. The coordinator is therefore not exposed through a public API route and must not be wired to the current unauthenticated conversation endpoint.
- No verified production WARP GATE adapter is connected to this coordinator.
- No Neural Link retrieval implementation is connected; context must be supplied by a trusted caller with provenance.
- No database persistence, durable audit store, rate/concurrency controls, provider cost controls, or production telemetry are added in this slice.
- The CI workflow has been committed but has not yet reported a passing run.

## Next gates

- **DB-03:** reconcile and certify one identity/tenant-isolation implementation from the existing T2/T3 branches before exposing a dual-brain API.
- **DB-04:** locate or explicitly create the Alien Mind provider adapter; configure secrets only in server-side hosting settings.
- **DB-05:** connect the coordinator through the existing runtime lifecycle without introducing a second orchestrator.
- **DB-06:** prove protected actions still require WARP GATE authorization, including deny/unavailable tests.
- **DB-07/08:** add redacted correlated telemetry and independent Inspector validation.
- **DB-09:** human-approved staging rollout only after all critical gates pass.

## Change boundary

Changes are confined to this feature branch. No merge to `main`, deployment, database migration, provider credential, production setting, or existing PR modification was performed.
