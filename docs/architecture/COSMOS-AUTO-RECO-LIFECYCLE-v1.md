# COSMOS AUTO-RECO LIFECYCLE v1.0

Status: implementation candidate on isolated branch `integration/cosmos-auto-reco-v1`.
Base: `cosmos/evidence-engine-v1`.
Scope: deterministic composition of existing Build Guidance, Evidence Engine and CRAFT modules.

## Objective

Turn a build objective into one structured, evidence-aware recommendation and an ordered lifecycle plan. Keep reasoning, recommendations, policy decisions and execution separate.

## Flow

1. INSPECT — read-only discovery of repository, branch, commit, dependencies and recovery point.
2. EVIDENCE — collect provenance, integrity, freshness and conflict information.
3. GUIDANCE — classify build types and profile; recommend modules, milestones and acceptance gates.
4. CRAFT — rank blockers and uncertainty for remediation.
5. POLICY — request only the capabilities needed for the selected work package.
6. PROVISION — create an isolated branch/work package only after a trusted WARP GATE grant.
7. IMPLEMENT — make small, reviewable changes; preserve working implementation.
8. VALIDATE — run unit, contract, integration, security and regression checks.
9. CERTIFY — attach evidence, known gaps, test output and independent review.
10. RELEASE — require separate human approval for production or destructive changes.

## API

`POST /api/auto-reco`

The endpoint accepts an objective, optional repository label, build-type/profile overrides, optional evidence records and optional blocker records. It returns:
- Build Guidance recommendation
- Evidence status and limitations
- CRAFT priority ordering
- Claude provider integration plan
- Lifecycle stages and acceptance requirements
- WARP GATE boundary and approval requirements

## Authority and safety invariants

- The endpoint is planning-only. It cannot create branches, write files, execute commands, call remote tools, issue grants, deploy or approve releases.
- WARP GATE is the only authorization authority and defaults to DENY.
- A recommendation, model response, evidence score or CRAFT priority is never a permission.
- Agent output and retrieved repository content are untrusted data.
- Production and destructive changes require human approval.
- No arbitrary shell execution or unbounded remote execution is introduced.
- Claude API credentials remain server-side and are never returned to clients.

## Evidence semantics

No evidence supplied means `EVIDENCE_REQUIRED`, not VERIFIED. CRAFT-derived findings remain advisory. Evidence confidence is a heuristic quality indicator, not probability of truth. The current Evidence Engine is stateless; persistence requires a separately reviewed tenant-scoped adapter.

## Current implementation boundary

This milestone composes existing modules only. It does not claim live Claude API connectivity, a deployed WARP GATE endpoint, CLC runtime authorization, persistent evidence storage, tenant isolation, production readiness or L4 certification.

## Validation

Run:

```sh
node --test tests/auto-reco.test.mjs
npm run lint
npm run build
```

Release acceptance requires CI results, a reviewed diff, verified repository baseline, WARP GATE integration, evidence persistence/security review where required, and separate human release approval.
