# COSMAXX Runtime Adapter v1.0

## Purpose

Provide a versioned, recommendation-only boundary between COSMOS Runtime and the COSMAXX optimization service.

## Scope

Phase 01 implements:
- A shared request/response contract.
- The canonical seven-domain identifier set.
- Authorization delegation before optimizer invocation.
- Optimizer timeout and abort signaling.
- Response validation and trace correlation.
- Explicit human approval on every recommendation.

Phase 01 does not implement:
- The seven-domain registry or domain adapters.
- A production optimizer.
- Runtime event transport.
- Automatic execution of recommendations.
- Authentication, persistence, or deployment wiring.

## Integration

Construct `CosmaxxRuntimeAdapter` with:
1. An optimizer implementing `CosmaxxOptimizer`.
2. An authorization provider implementing `CosmaxxAuthorization`.

Call `evaluate(request)` from a trusted server-side orchestration boundary. The authorization provider must independently validate the caller, domain scope and requested capabilities. Do not treat caller-supplied capability names as grants.

## Safety invariants

- This adapter returns recommendations only; it does not execute them.
- Authorization is checked before optimizer invocation.
- Authorization errors fail closed.
- All recommendations must set `requires_approval: true`.
- Recommendation domain identifiers must match the request.
- Confidence, when supplied, must be in the inclusive range 0..1.
- Optimizer timeouts abort the supplied signal and return a failed result.
- No credentials or secrets belong in request context or evidence references.

## Next phase

Implement the Seven-Domain Registry against the exported `COSMOS_DOMAIN_IDS` contract, then add registry-level validation and integration tests.
