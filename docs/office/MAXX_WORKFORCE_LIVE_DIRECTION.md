# COSMOS OFFICE — MAXX + Live Workforce Direction v1.0

Status: Direction initiated; implementation not yet integrated or deployed.
Base: `feature/cosmos-office-foundation-v1`
Working branch: `feature/cosmos-office-maxx-workforce-live-v1`

## 1. Objective
Extend COSMOS OFFICE with two coordinated workspaces:
1. **COSMOS MAXX** — multi-analyzer boards for evidence-led analysis, comparison, confidence, and decision support.
2. **COSMOS WORKFORCE LIVE** — an operational view of registered human and AI workers, assignments, and verified lifecycle states.

Neither workspace independently authorizes execution.

## 2. Repository evidence and reuse candidates
Inspected existing branches; these are candidates for selective reuse, not merged or certified dependencies:
- `feat/cosmos-omniboard-transformation-v1`: OmniBoard presentation shell and boundaries for departments, engines, POWERBOX, WARP GATE, evidence, and live status provenance.
- `feat/autonomous-workflow-runtime`: additive Live Data Swarm schema and authenticated heartbeat/event API; bounded workflow runtime prototype; tests and CI.
- `feature/cosmos-office-foundation-v1`: additive `/office` shell and initial application catalog.

The swarm API uses one shared service token and does not provide per-node credentials or dashboard user authentication. It must not be exposed to browser clients. The workflow runtime is a prototype, not a durable production orchestrator. Resolve or explicitly accept these limits before production use.

No MAXX implementation was located by available code search in accessible repositories. Treat earlier MAXX concepts and test claims as historical context requiring source-level revalidation before reuse.

## 3. Target architecture
```
COSMOS OFFICE
├── WORKFORCE LIVE
│   ├── Worker registry (human / agent / service)
│   ├── Assignment and mission view
│   ├── Lifecycle event stream
│   └── Evidence and freshness indicators
├── COSMOS MAXX
│   ├── Multi-Analyzer Board
│   ├── Evidence & Confidence Board
│   ├── Comparison / Benchmark Board
│   ├── Optimization Board
│   └── Decision Summary Board
└── Shared Platform
    ├── Identity and tenant context
    ├── Versioned module / capability manifests
    ├── Event ingestion and replay
    ├── Evidence and audit records
    └── WARP GATE policy enforcement
         └── Authorized runtime adapters
```

## 4. MAXX board contract
Every analyzer result carries:
- `analysisId`, `boardId`, `analyzerId`, analyzer version
- subject and declared scope
- input evidence references and source timestamps
- result, findings, and recommendation (distinct fields)
- confidence value plus rationale
- limitations, missing evidence, unresolved assumptions
- created/updated timestamps and status

Principles: separate observations, inferences, and recommendations; show provenance and freshness; never manufacture scores when data is missing; preserve analyzer versions and input snapshots; MAXX recommendations are advisory, never authorization.

## 5. Workforce Live event contract
Worker identity and display state come from a registry and lifecycle events, not animation timers.

Initial worker fields: `workerId`, `displayName`, `workerType` (human, agent, service), `role`, `capabilityIds`, `registryStatus`, `lastSeenAt`, `sourceId`, `sourceVersion`.

Lifecycle events: `worker.registered`, `worker.available`, `mission.assigned`, `work.started`, `work.progressed`, `review.requested`, `approval.pending`, `work.completed`, `work.failed`, `worker.heartbeat`.

Every event requires event ID, worker ID, timestamp, source, correlation/mission ID where applicable, and validated payload.

Animation rules:
- Animate only from received state changes or visibly labeled demo data.
- Distinguish stale, disconnected, unknown, and active workers.
- Never infer work activity from animation alone.
- Show last update and event source; provide reduced-motion mode.
- Human identity and presence must be transparent and consent-aware.

## 6. WARP GATE invariants
- Application visibility is not permission; registry membership is not execution clearance.
- A MAXX score or recommendation cannot authorize an action.
- Each execution request declares actor, capability, target scope, action kind, risk, and policy version.
- Policy evaluation is server-side before a handler is invoked.
- High-impact, destructive, external, or critical-risk actions require applicable policy restrictions and explicit human approval.
- Denials and approvals are auditable.
- No secrets or privileged credentials ship to browser code.
- Browser receives a least-privilege authenticated view model only.

## 7. Implementation sequence
**M0 — Source reconciliation:** compare candidate branch diffs and tests; identify compatible components and conflicts; do not merge whole branches blindly because candidates modify shared dashboard files.

**M1 — Shared contracts:** define versioned worker, mission, event, analyzer, evidence, and board schemas; add validation and contract tests; establish server-side authorization and audit interfaces before execution controls.

**M2 — MAXX read-only board:** build source-grounded board UI; add analyzer registry metadata and evidence-linked result rendering; label fixture data; add empty, stale, incomplete, and error states.

**M3 — Workforce Live read-only view:** connect authenticated server-side event ingestion/replay; build worker cards, mission lanes, state timeline, freshness, and reduced-motion behavior; no tool execution from animation surface.

**M4 — Controlled integration:** connect MAXX boards to workforce mission/evidence references; add role- and capability-aware access; require WARP GATE decision and audit evidence for executable operations.

**M5 — Verification and release:** lint, typecheck, unit/contract tests, production build, API integration tests, responsive UI checks; verify authentication, tenant isolation, replay, stale-state handling, and policy denials; deploy only after preview verification and explicit release approval.

## 8. Acceptance criteria
- Office root dashboard and existing conversation APIs remain unchanged.
- MAXX results trace to analyzer version and input evidence.
- Workforce cards and animation reflect authoritative events and timestamps.
- Demo data is visibly labeled and cannot be confused with real workers.
- Browser code contains no service bearer token or privileged credential.
- WARP GATE denies unauthorized operations server-side.
- Connected states are backed by live health checks and evidence.
- No merge, production deployment, or claim of live operation without verification.

## 9. Current execution status
- Direction branch created from Office foundation branch.
- **M0 source reconciliation completed** and recorded in `docs/office/INTEGRATION_INSPECTOR_M0_REPORT.md`.
- OmniBoard, Live Data Swarm, workflow-runtime, and defensive security-operations repository sources inspected to the extent documented in the M0 report.
- MAXX source implementation not located in accessible repository search; build new versioned contracts.
- Workflow-runtime candidate blocked by a literal escaped newline source defect and documented host-level maturity gaps.
- Shared dashboard file collisions documented; no candidate branch merged.
- Local build, test execution, runtime integration, and deployment remain pending.
