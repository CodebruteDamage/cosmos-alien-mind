# COSMOS Guidance Decision Engine v1.0

**Status:** Stacked integration candidate; review and CI required.  
**Mode:** Deterministic decision plus conditional recommendation-only CRAFT triage. No tool execution or remediation.

## Position in the lifecycle

Franz Generate Template -> Evidence Analysis -> Auto Guidance -> Guidance Decision Engine -> Conditional CRAFT assessment -> Existing authorized orchestration -> Evidence and Certification.

## Decision precedence

1. STOP when cancellation is active.
2. DENY when policy denies the recommendation or the work is outside guidance scope.
3. NO_ACTION when the objective is already satisfied.
4. GATHER_EVIDENCE when the lifecycle evidence is insufficient or untraceable.
5. DEFER when required dependencies are not satisfied.
6. INVOKE_CRAFT only when at least one blocker is explicitly verified.
7. REQUIRE_APPROVAL for R2/R3 actions without valid action-specific approval.
8. PROCEED when all decision gates pass.

## Conditional CRAFT handoff

- The guidance decision is the sole trigger for CRAFT assessment.
- Only blocker IDs returned as verified by Guidance are eligible.
- Each eligible blocker must include caller-supplied complexity, risk, urgency, dependency, confidence, and at least one evidence reference.
- Missing assessment inputs return GATHER_EVIDENCE; no scores or evidence are inferred.
- CRAFT returns triage recommendations only and marks every result as requiring human approval.
- CRAFT does not authorize builds, change permissions, or execute remediation.

## Scope and governance

- A build is permitted by the decision layer only when guidance explicitly sets buildRequired: true and all decision gates pass.
- A CRAFT decision does not authorize a build.
- The API does not invoke an orchestrator or WARP GATE and has no execution side effects.
- The existing authorized orchestrator must independently enforce WARP GATE permissions immediately before any side effect.
- Evidence references are caller-supplied identifiers; this adapter preserves them but does not independently verify their contents.
- A recommendation or confidence score is not an execution grant.

## API

- GET /api/guidance/decision returns engine metadata and supported outcomes.
- POST /api/guidance/decision validates a guidance/evidence/blocker envelope, returns the decision, and conditionally returns CRAFT recommendations for verified blockers.

## Validation

Run:

    node --experimental-strip-types --test tests/*.test.mjs engines/craft/tests/*.test.mjs
    npx tsc --noEmit
    npm run lint
    npm run build

This candidate is not production-certified. Authentication, durable audit persistence, live Evidence Engine and WARP GATE adapters, and execution integration remain outside this milestone.
