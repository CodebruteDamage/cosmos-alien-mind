# COSMAXX Phase 01 — Runtime Adapter Hardening

## Milestone intent
Harden the existing recommendation-only adapter without replacing its contract or granting execution authority.

## Changes
- Validate request objects, evidence references, and requested capability strings at runtime.
- Validate recommendation objects, evidence references, impact values, and finite confidence values.
- Fail closed when authorization returns a malformed decision.
- Bound authorization and optimizer waits independently.
- Abort the optimizer signal on timeout.
- Avoid returning arbitrary provider exception text in runtime errors.
- Add focused contract and failure-path tests.

## Boundaries
- COSMAXX remains recommendation-only; it does not execute recommendations or grant capabilities.
- WARP GATE remains the independent authorization authority for side effects.
- Human approval remains mandatory for each recommendation.
- AbortSignal is a cancellation request; providers that ignore it may continue work. Use cooperative providers and reconcile timed-out work.

## Validation commands
- npm run test:cosmaxx
- npm run typecheck
- npm run lint
- npm run build

Do not merge or deploy until all required checks pass and the host WARP GATE integration is verified separately.
