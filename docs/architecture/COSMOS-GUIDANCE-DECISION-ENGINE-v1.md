# COSMOS Guidance Decision Engine v1.0

**Status:** Isolated implementation candidate; review and CI required.  
**Mode:** Deterministic decision only. No tool execution, repository writes, or external side effects.

## Position in the lifecycle

Franz Generate Template -> Evidence Analysis -> Auto Guidance -> Guidance Decision Engine -> Conditional CRAFT -> Authorized Orchestration -> Evidence and Certification.

## Decision precedence

1. STOP when cancellation is active.
2. DENY when policy denies the recommendation or the work is outside guidance scope.
3. NO_ACTION when the objective is already satisfied.
4. GATHER_EVIDENCE when evidence is insufficient or untraceable.
5. DEFER when required dependencies are not satisfied.
6. INVOKE_CRAFT only when at least one blocker is explicitly verified.
7. REQUIRE_APPROVAL for R2/R3 actions without valid action-specific approval.
8. PROCEED when all decision gates pass.

## Scope controls

- CRAFT is skipped when there are no verified blockers.
- An unverified blocker does not trigger CRAFT.
- A build is permitted by this decision layer only when guidance explicitly sets `buildRequired: true`.
- A CRAFT decision does not authorize a build.
- The endpoint returns a decision only. It never invokes CRAFT, an orchestrator, WARP GATE, or a tool.
- The authorized orchestrator must independently enforce WARP GATE permissions immediately before any side effect.
- A recommendation or confidence score is not an execution grant.

## API

- `GET /api/guidance/decision` returns engine metadata and supported outcomes.
- `POST /api/guidance/decision` validates a guidance/evidence/blocker envelope and returns a deterministic decision.

## Validation

Run:

```sh
node --experimental-strip-types --test tests/guidance-decision.test.mjs
npx tsc --noEmit
npm run lint
npm run build
```

This implementation candidate is not production-certified. Authentication, durable audit persistence, live Evidence Engine/CRAFT/WARP GATE adapters, and orchestrator integration are intentionally excluded from this bounded milestone.
