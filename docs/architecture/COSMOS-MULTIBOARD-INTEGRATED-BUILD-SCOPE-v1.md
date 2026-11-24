# COSMOS MULTIBOARD — Integrated Platform Build Scope v1.0

Status: FOUNDATION SCOPE RECORDED — implementation not yet integrated
Working branch: `integration/cosmos-multiboard-foundation-v1`
Base: `integration/m1.3-runtime-wiring` @ `37e73d493b1cbc6e4336abe6068518b8ba8de3e9`
Release target: isolated Vercel staging only after build configuration and validation are corrected
Production deployment: explicitly out of scope

## 1. Mission

Deliver one coherent COSMOS operating environment with multiple specialized boards sharing one identity, evidence, registry, event, lifecycle, audit, and authorization foundation.

"Integrated" means shared versioned contracts and verified end-to-end data flow. It does not mean merging every feature branch, presenting static cards as connected services, or granting every board execution authority.

## 2. Product surfaces

### A. Executive and orchestration boards
1. **Command Center** — platform health, deployment state, active missions, blocked work, approvals, evidence freshness, and cross-board navigation.
2. **OmniBoard** — unified board directory and cross-domain operational overview; departments, engines, services, and integrations are registered modules, not hard-coded claims.
3. **Workforce Live** — human/agent/service registry, assignments, lifecycle events, availability and freshness. Demo fixtures must be visibly labeled.

### B. Reasoning and engineering boards
4. **12 GAP Cycle** — canonical 12-stage delivery lifecycle, stage evidence, owners, gates, blockers, and progression history.
5. **MAXX Analyzer** — multi-analyzer workspaces, evidence comparison, confidence rationale, benchmarks, and decision summaries. Advisory only.
6. **CRAFT Blockers** — blocker intake, weighted triage, evidence-gap detection, remediation proposals, and approval handoff. No autonomous remediation.
7. **COSMAXX Optimization** — resource/cost/performance optimization proposals with baseline, constraints, expected impact, uncertainty, and rollback plan.
8. **SHAPE Architecture** — architecture maps, dependency boundaries, change-impact analysis, design decisions, and review records.
9. **Inspector** — read-only repository, endpoint, configuration, and integration inspections; provenance-backed findings and explicit verification status.
10. **DevOps / Release Board** — branches, commits, CI runs, deployment environments, preview status, release gates, and rollback references.

### C. Governance and execution boards
11. **WARP GATE Hall** — policy decisions, capability grants, approvals, denials, policy versions, replay protection, and audit status. This is the authorization boundary, not an executor.
12. **CLC Lifecycle Board** — create and advance governed missions/workflows; lifecycle state changes require WARP GATE authorization before persistence.
13. **Workflow Studio** — versioned workflow definitions, dependency graphs, bounded runs, approval waits, results, and audit trails. No model-generated arbitrary code execution.
14. **Live Data Swarm** — registered node heartbeats, validated events, freshness, degraded/offline states, and source provenance. No browser-held service secrets.

### D. Knowledge, integration, and edge boards
15. **Reference Center / Knowledge** — approved specifications, files, evidence references, source versions, and decision records.
16. **Android / Edge Bridge** — registered mobile/edge nodes, runtime probes, connection health, and narrowly scoped event ingestion. Heartbeat is not remote-shell capability.
17. **Office Applications** — Docs, Slides, Design, Sheets, Boards, Data, Motion, Code, and Browser as independently registered modules. A catalog entry is not proof of a connected provider.

## 3. Shared platform foundation (mandatory)

All boards use these shared services and versioned contracts:

- Identity: authenticated principal, tenant, roles, session provenance; server-derived identity only.
- Module registry: module ID, version, owner, route, capabilities requested, dependencies, lifecycle state, health source.
- Capability registry: declared actions, resource scopes, risk class, approval policy, handler binding.
- WARP GATE adapter: structured ALLOW / DENY / REQUIRE_APPROVAL / BLOCKED decisions; decision binding; verified, scoped, expiring, single-use grant consumption; fail closed.
- CLC: lifecycle coordination only; never capability execution.
- Evidence registry: immutable source reference, digest where available, captured time, source version, provenance, confidence rationale, retention classification.
- Event bus / inbox: schema validation, event IDs, idempotency, replay handling, source identity, timestamps, correlation IDs.
- Audit: actor, tenant, action, target, policy version, decision, lifecycle transition, correlation ID, outcome; never secrets or raw grants.
- Persistence: tenant-scoped repositories, optimistic concurrency, migrations reviewed separately; no live DB migration in this build scope.
- Observability: health/readiness, structured logs, trace IDs, deployment and integration state.
- UI shell: responsive navigation, module status labels, access-denied states, stale/unknown/error states, reduced motion, keyboard accessibility.

## 4. Non-negotiable governance invariants

1. Board visibility, registry membership, analyzer output, CRAFT score, MAXX recommendation, or workforce presence never authorizes an action.
2. All writes and external actions pass server-side identity and WARP GATE checks before the handler or persistence mutation.
3. Missing identity, tenant, policy, grant verifier, audit dependency, or upstream response fails closed.
4. Human approval cannot override hard runtime restrictions.
5. No credentials, bearer tokens, signing keys, or raw grants in browser code, prompts, fixtures, or logs.
6. Tenant and subject identifiers are derived from authenticated server context, never trusted from client JSON.
7. Inspector is read-only by default; all findings include evidence and confidence.
8. Demo data is visibly labeled and cannot be counted as live telemetry or production evidence.
9. Every board reports one of: SPECIFICATION_ONLY, UI_FIXTURE, IMPLEMENTED_UNVERIFIED, INTEGRATION_TESTED, VERIFIED, or DISABLED.
10. COSMOS Cyber Sec Ops remains a separately versioned security source. Alien Mind consumes reviewed interfaces; do not wholesale merge the security repository.

## 5. Source branch reconciliation — candidates, not certified dependencies

| Candidate | Observed source | Integration decision |
|---|---|---|
| `feature/cosmos-office-maxx-workforce-live-v1` @ `47a31419b468c5729b1b41b729309728a4cc3f07` | Additive `/office`, module catalog, CRAFT API/UI, worker and analyzer contracts; documentation explicitly labels frontend and fixtures | Reuse selectively after compile/test review; fix missing/incorrect imports and replace fixtures only through verified adapters |
| `feat/cosmos-omniboard-transformation-v1` @ `7c023e449d1558e82937387d8e8b7e1b2c1398c0` | Branch tree currently matches a thin application shell; no separate integrated OmniBoard implementation located in inspected paths | Treat as direction/reference, not a finished board |
| `feat/omniboard-shell-v1` @ `026a4f692ac355cb6c1a09c6cf9bba606667ae32` | Same root baseline SHA | No distinct implementation to merge |
| `cosmos/craft-engine-v1` @ `b75b4bef4f42b726c9f3b68b97b84570806a10a1` | CRAFT engine and tests; branch also contains Android bridge and docs | Extract CRAFT module selectively; do not ship unrelated branch changes as a CRAFT-only release |
| `feat/autonomous-workflow-runtime` @ `e762c5c3ba9a8c447a35d7e62aae8e88a58effe0` | Bounded workflow prototype and swarm heartbeat/event API; shared token and no durable production orchestration documented | Reuse schemas and bounded runtime only after auth, per-node identity, persistence, replay and isolation gaps are closed |
| `feat/workflow-engine` @ `66f320b6a1e91c6371a4a2947fae2d57bd366d47` | UI prototype with hard-coded scenario and local state | Reuse interaction patterns only; replace fixture state and stale scenario content |
| `feat/cosmos-api-security-t2` @ `0790aaf8129622ffa95f646f980a08186a27ac14` | Identity and API security contracts | Inspect source and tests; integrate only compatible server-side boundaries |
| `feat/cosmos-better-auth-t3` @ `0428d80a8fe87c90c6ad908fdd3f0bcb0c4fc6fe` | Better Auth routes, client and onboarding surfaces | Candidate identity implementation; verify secrets, tenant mapping, session policy, migrations and tests before adoption |
| `feat/cosmos-inspector-v1` @ `752d35299a199bab50fa6c898ca0a13ebb5b917a` | Inspector request/report schemas and README | Specification-only; runtime remains a separate implementation milestone |
| `feature/cosmos-l4-skill-ecosystem-v1` @ `e47015e9789531149a22035fe20b3e6012953b11` | L4 skill governance baseline and certification gate docs | Governance reference; not execution-enabled |
| Cyber Sec Ops `feature/warp-gate-core-v1` | Separately maintained WARP GATE v1.1 authorization core | Keep independent; consume pinned, reviewed service contracts and adapters |

Branch SHAs are source snapshots observed during scope preparation. Re-fetch branch heads and inspect complete diffs before any cherry-pick or integration.

## 6. Delivery sequence and dependency gates

### MB-0 — Source reconciliation and restore baseline
- Freeze source SHAs; compare candidate diffs against integration base.
- Inventory overlapping files, tests, schemas, env requirements and migrations.
- Create restore points; define module ownership and compatibility matrix.
- Deliverable: source map, merge/cherry-pick plan, blocker register.
- Gate: no unknown branch is merged wholesale.

### MB-1 — Shared contracts and security boundary
- Establish module, capability, worker, mission, event, evidence, analysis, board and audit schemas.
- Connect authenticated tenant context.
- Complete WARP GATE decision and grant-verification interfaces; fail closed.
- Complete CLC create/advance authorization before mutation.
- Deliverable: contract tests and negative security tests.
- Gate: tenant isolation and denial tests pass before any write-enabled module.

### MB-2 — Multiboard shell and registry
- Build one responsive shell with role-aware navigation and module registry.
- Render board status, provenance, last-updated time, health, empty/stale/error/disabled states.
- Register board routes through manifests, not duplicated hard-coded navigation.
- Deliverable: read-only integrated shell.
- Gate: every visible module status matches actual implementation state.

### MB-3 — Evidence and analysis boards
- Integrate MAXX analyzer registry and evidence-linked results.
- Integrate CRAFT triage and approval handoff.
- Add COSMAXX optimization and SHAPE architecture proposal contracts.
- Add benchmark comparisons and confidence rationale.
- Deliverable: read-only/advisory multi-analyzer boards.
- Gate: no fabricated score, source, confidence, or live state.

### MB-4 — Inspection and 12 GAP lifecycle
- Implement Inspector read-only scanners/adapters and signed-off report states.
- Implement canonical 12-stage lifecycle with evidence, stage owners, blockers and transitions.
- Connect CRAFT findings to GAP stage references.
- Deliverable: traceable inspection-to-remediation planning loop.
- Gate: Inspector evidence and CLC/WARP GATE lifecycle authorization tests pass.

### MB-5 — Workforce, workflow, and event integration
- Implement worker registry, assignment model, event ingestion/replay and freshness.
- Connect bounded workflow runtime via registered handlers only.
- Persist lifecycle and event state with idempotency and tenant isolation.
- Deliverable: verified read-only workforce view and governed workflow runs.
- Gate: per-node identity, replay, audit, failure and approval tests pass.

### MB-6 — Office and edge integrations
- Integrate Docs/Slides/Design/Sheets and Android/edge connectors as separate modules.
- Each provider requires explicit connection, least-privilege scope, health check and test evidence.
- Deliverable: provider-backed modules with truthful connection states.
- Gate: no module claims connected until end-to-end verified.

### MB-7 — Release verification
- Run lint, typecheck, unit, contract, integration, build, API, tenant isolation, authorization denial, replay, audit and responsive accessibility checks.
- Stage deployment with preview-only environment and synthetic data.
- Run smoke tests and rollback verification.
- Deliverable: evidence-backed release report and certification recommendation.
- Gate: production promotion and PR merge require separate review/approval.

## 7. Current blockers observed during scope preparation

- CRAFT staging deployment `dpl_FmhcAuoU5ajCVXwMT8RNRq4WCi62` ended in ERROR: `STATIC_BUILD_NO_OUT_DIR`; Vercel project framework is unset and build configuration expects a `public` output directory. Do not treat the URL as a successful app deployment or retry without correcting and verifying project build settings.
- The Office foundation docs explicitly state its catalog is static and the route has no authentication, authorization backend, module APIs, file service, agent execution or provider connections.
- Workforce and MAXX examples include demo fixtures. Demo state must remain labeled.
- Live Data Swarm prototype uses a shared service token and lacks per-node credentials and dashboard user authentication.
- Workflow runtime prototype lacks durable persistence, distributed locking and external credential storage.
- Inspector runtime is specification-only.
- WARP GATE source currently provides authorization core/contracts, not a discovered deployed HTTP endpoint.
- Existing project connection metadata shows the `cosmos-alien-mind` Vercel project linked to a different Git repository than this canonical COSMOS repository in the inspected Vercel context. Resolve repository linkage before automated Git-based releases.

## 8. Acceptance criteria for "fully integrated"

- One authenticated, tenant-aware shell.
- Every board has a versioned manifest, owner, dependency list and truthful status.
- Shared evidence IDs and correlation IDs work across boards.
- MAXX/CRAFT/SHAPE/COSMAXX outputs can be referenced in 12 GAP and CLC records without becoming permissions.
- Inspector findings can be linked to blockers and remediation plans.
- Workforce events can be correlated with mission and workflow state.
- WARP GATE decisions and verified grants gate every protected mutation/external action.
- CLC coordinates state; registered capability handlers perform only authorized bounded actions.
- Audit events are queryable and secret-free.
- All critical tests pass; staging deployment is READY and smoke-tested.
- Production release and L4 certification remain separate approval gates.

## 9. Current status

- Scope: RECORDED
- Source discovery: PARTIAL; candidate branches identified, full diff reconciliation pending
- Shared contracts: PARTIAL (M1.2/M1.3 foundation only)
- UI integration: NOT STARTED on this branch
- Runtime integration: NOT VERIFIED
- Staging deployment: BLOCKED by build configuration
- Production: NOT AUTHORIZED
- L4 certification: NOT CLAIMED
