# COSMOS Governed Automation Build Procedure v1.0

**Status:** Build-instruction baseline on an isolated integration branch. It is not a claim of live autonomous execution or production certification.
**Applies to:** Auto Guidance, Guidance Decision Engine, conditional CRAFT triage, the existing orchestrator, and WARP GATE.
**Build sizing:** Start with a 1x1 build. Escalate to a full build only after dependencies, interfaces, scope, and authorization boundaries are verified.

## Objective

Make build work continuous by resolving verified, in-scope blockers before attempting the requested implementation. Do not create another orchestrator. Reuse the existing Guidance Decision Engine, CRAFT, current authorized orchestrator, and WARP GATE.

## Standard execution procedure

1. **INTAKE** — Record the objective, requested outcome, scope, acceptance criteria, risk class, stop condition, and whether implementation is requested.
2. **INSPECT** — Inspect the current repository, branch, working changes, interfaces, tests, and existing components before editing. Preserve working code. Record evidence references and distinguish verified facts from assumptions.
3. **DECIDE** — Run Auto Guidance and the Guidance Decision Engine. Respect its outcomes:
   - `STOP`: halt and preserve state.
   - `DENY`: do not proceed outside policy or scope.
   - `NO_ACTION`: record evidence if the objective is already satisfied.
   - `GATHER_EVIDENCE`: perform the smallest safe read-only check.
   - `DEFER`: identify and verify the missing dependency.
   - `INVOKE_CRAFT`: only for explicitly verified blockers.
   - `REQUIRE_APPROVAL`: pause for action-specific approval.
   - `PROCEED`: continue only to the next authorized step.
4. **BLOCKER TRIAGE** — For each verified blocker, provide CRAFT with its evidence references and caller-supplied complexity, risk, urgency, dependency, and confidence dimensions. If any required input is missing, gather evidence; never invent a score, cause, or fix. CRAFT is recommendation-only.
5. **REMEDIATION PLAN** — Select the smallest in-scope fix that resolves the highest-priority dependency blocker. State expected files/interfaces, rollback or recovery approach, risk, and acceptance tests. Do not expand scope to unrelated improvements.
6. **WARP GATE CHECK** — Immediately before every side effect, the existing authorized orchestrator must obtain an explicit WARP GATE authorization for the exact actor, tenant, capability, action, target scope, parameters, and policy version. Verify and consume the matching grant through the trusted runtime. `REQUIRE_APPROVAL`, `DENY`, `BLOCKED`, malformed responses, missing grants, failed verification, timeout, or unavailable WARP GATE all mean no side effect. A CRAFT recommendation or Guidance `PROCEED` is not an execution grant.
7. **BUILD** — Apply only the authorized change. Use a 1x1 build for one isolated blocker or one narrow interface. Use a full build only when the dependency chain and contracts are verified, the work forms one coherent milestone, and the full scope is explicitly authorized.
8. **TEST AND VALIDATE** — Run focused tests first, then relevant regression tests, type-check, lint, and production build as applicable. Verify acceptance criteria against actual outputs. A requested transition or successful mock test does not prove live integration.
9. **REASSESS AND LOOP** — Re-run inspection and decision gates after each fix. If a new verified blocker appears, return to blocker triage and resolve it before dependent work. Continue only while scope, budget, evidence, and authorization remain valid.
10. **CLOSE** — Record changed files, commit/PR, exact commands, pass/fail results, evidence references, remaining blockers, and the next justified step. Never report deployment, merge, runtime integration, or certification unless independently verified.

## Automatic continuation policy

Automatic continuation is allowed only for explicitly pre-authorized, low-risk, reversible actions within the approved scope and execution budget. The orchestrator must re-check policy and WARP GATE before each side effect. Do not infer blanket permission from a prior approval.

Pause and request human approval for high-impact or externally consequential changes, production deployment, live database migrations, credential or identity changes, destructive actions, scope expansion, or any action classified R2/R3 by policy. Stop on a stop request, policy denial, exhausted retry/time budget, failed verification, or unresolved security boundary.

Retries must be bounded and limited to steps explicitly marked retry-safe. Do not repeat a non-idempotent operation when its completion state is uncertain; reconcile state first. If validation fails, stop dependent stages, capture the failure evidence, and return to analysis.

## Required build report

Every run reports:
- Build size: **1x1** or **full**, with reason.
- Objective, scope, and acceptance criteria.
- Inspected branch/commit and evidence references.
- Guidance decision and verified blocker IDs.
- CRAFT recommendations and missing evidence, if any.
- WARP GATE decision/grant verification status for each side effect (never expose grant tokens).
- Files changed and implementation summary.
- Commands and exact test/build outcomes.
- Remaining blockers, approvals needed, and next step.

## Current implementation boundary

The Guidance Decision Engine and CRAFT candidate provide decisions and recommendations; they do not execute actions. The 12 GAP Cycle candidate evaluates stage transitions but does not itself persist lifecycle state or execute tools. The WARP GATE adapter candidate defines a fail-closed contract but requires a trusted live transport, verified grant implementation, authenticated server-side identity, audit persistence, and runtime integration before live authorization can be claimed. The repository's existing MVP documentation also identifies authentication and per-user isolation as unfinished. Keep those as explicit release blockers.

## Acceptance gates

- Existing architecture is reused; no duplicate orchestration engine is added.
- CRAFT is invoked only for verified blockers and remains recommendation-only.
- No side effect occurs without a fresh, exact-scope WARP GATE authorization and verified grant.
- Missing evidence, missing dependencies, approval-pending, denial, and service failure fail closed.
- Each build is scoped, testable, reversible where feasible, and evidence-backed.
- No stage is marked complete without its required evidence and passing validation.
