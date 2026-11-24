# COSMOS 12 GAP CYCLE v1.0

**Status:** Runtime transition policy implemented as a candidate on the Guidance/CRAFT integration branch; CI and deployment verification pending.
**Purpose:** Govern problems, opportunities, blockers, and improvements from discovery through verified closure and evolution.

## Canonical stages

1. **GAP** — register the problem, opportunity, blocker, or improvement.
2. **ANALYSIS** — analyze the objective and available evidence.
3. **PARALYSIS** — hold progression while uncertainty, risk, or missing authority is unresolved.
4. **ROOT CAUSE** — identify and evidence the underlying cause.
5. **SHAPE** — define the smallest in-scope solution and acceptance criteria.
6. **OPTIMIZATION** — remove unnecessary complexity and optimize the approach.
7. **PROVISION** — verify dependencies, environment, and required resources.
8. **BUILD** — implement only the approved, in-scope change.
9. **TEST** — run relevant tests.
10. **VALIDATE** — verify acceptance criteria and runtime behavior.
11. **CLOSE** — record evidence, acceptance, and the closure decision.
12. **EVOLVE** — capture lessons and justified follow-on improvements.

## Runtime rules

- Progression is sequential by default; a stage cannot be skipped.
- Backward iteration is permitted only with a rationale and traceable evidence.
- PARALYSIS is an explicit hold state, not permission to continue execution.
- PROVISION requires verified dependency readiness.
- BUILD requires explicit scope authorization; R2/R3 work also requires action-specific approval.
- TEST and VALIDATE require their respective passing test evidence.
- CLOSE and EVOLVE require verified acceptance criteria.
- Stop requests halt progression and preserve the current state.
- Evidence references are caller-supplied identifiers; this module does not independently verify external evidence contents.

## Governance boundaries

The cycle evaluates stage transitions only. It does not execute tools, grant permissions, run CRAFT, bypass WARP GATE, deploy software, or persist lifecycle state. Guidance remains the decision authority; CRAFT remains recommendation-only; the authorized executor and WARP GATE independently enforce permissions before side effects. No stage is certified complete merely because a transition was requested.

## Validation

Run:

    node --experimental-strip-types --test tests/*.test.mjs engines/craft/tests/*.test.mjs
    npx tsc --noEmit
    npm run lint
    npm run build

Durable lifecycle storage, authenticated actor identity, independently verified evidence, and live WARP GATE integration remain separate follow-on requirements.
