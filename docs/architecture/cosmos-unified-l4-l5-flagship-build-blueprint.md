# COSMOS Unified L4/L5 Flagship Build Blueprint

Status: architecture refinement provisioned on an isolated feature branch
Date: 2026-11-28
Canonical repository: `CodebruteDamage/cosmos-alien-mind`
Design target: L5-capable architecture; implementation and qualification must pass L4 first
Main branch: unchanged

## 1. Executive decision

COSMOS is one governed runtime with modular capabilities, not a collection of independently competing orchestrators or authorization engines.

The flagship is built on a minimal shared core and reusable specialist modules. Existing engines are reused when their responsibility already exists. A new engine or service is justified only by a documented capability gap, an explicit owner, a bounded contract, and measurable acceptance criteria.

The architecture is **L5-designed / L4-qualified**:
- L4 establishes reliable, repeatable, evidence-backed autonomy under deterministic governance.
- L5 adds measured adaptation, proactive discovery, optimization, and learning inside the same immutable security and approval boundaries.
- L5 capability does not imply L5 certification. Certification requires benchmark evidence across all seven COSMOS domains.

## 2. Flagship build types

The flagship platform supports four initial build types. These are composition profiles over shared runtime contracts, not four separate codebases.

| Build type | Purpose | Core composition |
|---|---|---|
| BT-01 CORE | Governed single-runtime assistant and control plane | Alien Brain, Core, Identity, WARP GATE, Evidence, Validation, Audit |
| BT-02 MODULAR | Pluggable engines and reusable specialist modules | CORE plus module registry, versioned contracts, adapters, capability discovery |
| BT-03 AGENTIC | Task-force and multi-agent orchestration | MODULAR plus objective alignment, owner/provider registries, compiler, bounded task runtime |
| BT-04 HYBRID | Local, cloud, mobile and edge coordination | AGENTIC plus trusted node identity, environment-bound grants, synchronization and recovery |

BT-05 ENTERPRISE and BT-06 EDGE remain later extensions. They must reuse the same governance, identity, evidence, and lifecycle contracts.

## 3. Unified architecture

### A. Experience and intent
- OMNIBOARD / user interfaces capture directives, context, constraints, approvals, and status.
- ALIEN BRAIN interprets context, compares reasoning paths, and proposes decisions.
- Inputs from users, models, files, connectors, nodes, and external systems are untrusted until validated.
- The requester is not automatically the Task Owner or an execution principal.

### B. Intelligence and orchestration
- INTELLIGENCE ORCHESTRATOR discovers available capabilities, forms the smallest adequate intelligence batch, coordinates dependencies, and tracks lifecycle.
- ORCH owns lifecycle coordination, not universal task accountability.
- TPO / Task Provider assembles specialist providers and execution candidates.
- A task has exactly one accountable Task Owner, represented by a stable principal from a trusted owner registry.
- Objective, subject, alignment rationale, capability requirements, dependencies, risk, scope and acceptance criteria are mandatory inputs to assignment.

### C. Prescan and evidence
- One reusable COSMOS Scan Module composes Repository Inspector, Architecture Inspector, Dependency Scanner, Security Scanner, Runtime Inspector, Capability/Integration Scanner, and Evidence/Gap Analyzer.
- C-INSPECTOR/CME maintains provenance, source identity, digest, freshness, confidence, and evidence continuity.
- The Scan Module is a capability, not a separate Task Owner or competing orchestrator.
- Repository work requires a read-only prescan before implementation. Other domains require the equivalent domain prescan.
- Findings are classified as reusable, missing, incomplete, duplicated, risky, or unknown.

### D. Planning and optimization
- COSMOS Compiler converts the approved objective, ownership scope, evidence, dependencies and acceptance criteria into a typed, versioned execution plan.
- COSMAXX compares alternatives for impact, correctness, security, complexity, performance, cost, resilience and reuse.
- COSMAXX recommends the smallest effective change with the highest verified value. It cannot authorize, grant, or execute.
- Guidance determines PROCEED, GATHER_EVIDENCE, INVOKE_CRAFT, REQUIRE_APPROVAL, DEFER, DENY, STOP, or NO_ACTION.
- CRAFT is conditional blocker triage/remediation planning. It is not a universal step and cannot self-authorize remediation.

### E. Routing and trusted runtime
- Owner Registry identifies accountable principals; Execution Provider Registry identifies executable providers. These registries are distinct.
- Load Balancer selects only trusted, active, capability-attested providers that satisfy scope, environment, health, capacity, data eligibility, independence and budget constraints.
- Failover changes the execution provider, not the Task Owner, unless a separately recorded owner handoff is accepted.
- The runtime requires trusted host dependencies: authenticated identity, grant verifier, atomic nonce store, approval store, durable audit sink, and trusted provider registry.
- M04 readiness is only `ready_for_review`; it must always report `productionActivationAllowed: false` until separate activation governance exists.

### F. Authorization and execution
- WARP GATE is the sole authorization and policy-enforcement authority.
- Every protected action is bound to actor, tenant, workflow, step, capability, action, exact scope, canonical parameter digest, policy version, risk, approval requirement, expiry and replay-safe nonce.
- ALLOW without a signed/verified, exact-match, unexpired grant and atomically consumed nonce is not authorization.
- DENY, REQUIRE_APPROVAL, BLOCKED, malformed decision, missing grant, binding mismatch, expired grant, replay, timeout, verifier failure, missing identity, or unavailable WARP GATE all block the protected action.
- Human approval is required for consequential, disruptive, externally impactful, and policy-designated actions. Approval cannot override a security prohibition or WARP GATE denial.
- Execution is bounded by work-package scope, capability allowlist, time/resource budgets, retry policy, idempotency key, checkpoint and verified postconditions.
- No model, owner, provider, optimizer, orchestrator, or user-facing UI can mint grants or self-grant permissions.

### G. Independent assurance and evolution
- Validation independently verifies functional acceptance, tests, integration, security, regression, resilience and benchmark results.
- Audit independently verifies identity, owner history, scope versions, provider attestations, approvals, WARP GATE decisions, evidence provenance, state transitions and closure.
- A Task Owner submits closure evidence; the Validator and Auditor independently decide whether their gates pass.
- Failed checkpoints create owned remediation tasks. CRAFT may triage blockers; execution still requires the original governance path.
- EVOLVE learns only from validated outcomes and can propose changes. Changes to policy, permissions, security boundaries, or consequential execution require explicit governance and human approval.

## 4. Single responsibility map — no duplicate engines

| Capability | Canonical owner | Must not do |
|---|---|---|
| Context reasoning | ALIEN BRAIN | Grant permissions or execute tools |
| Lifecycle coordination | ORCH / Intelligence Orchestrator | Become default owner for every task |
| Accountable outcome | One Task Owner principal | Self-authorize or self-audit |
| Specialist assembly | TPO / Task Provider | Replace accountable owner |
| Prescan | COSMOS Scan Module / C-INSPECTOR | Modify source during prescan |
| Evidence provenance | CME / Evidence Engine | Fabricate missing evidence |
| Planning | COSMOS Compiler | Expand approved scope |
| Optimization | COSMAXX | Execute recommendations or weaken controls |
| Blocker triage | CRAFT | Run unapproved remediation |
| Provider routing | Load Balancer | Grant permissions or silently change owner |
| Authorization | WARP GATE | Delegate authority to optimizer or router |
| Execution | Bounded Runtime | Run undeclared capabilities or scope |
| Acceptance | Independent Validation | Validate its own implementation as sole reviewer |
| Governance assurance | Independent Audit | Rewrite authorization history |
| Learning | EVOLVE | Self-modify governance or bypass release gates |

SHAPE owns architecture refinement. DEFENDER and FORCEFIELD provide security/threat capabilities. DEVOPS provides build/release capabilities. HOOKS provides workflow integration. DISCOVERY supplies evidence-backed capability discovery. These are specialist providers, not parallel control planes.

## 5. Canonical task and ownership contract

Every executable task must have a versioned Ownership Scope Contract (OSC) containing:
- immutable task, parent, correlation and contract identifiers;
- objective and explicit parent-objective alignment;
- canonical subject and alignment rationale;
- in-scope deliverables, exclusions, repository/resource/environment boundaries;
- exactly one accountable owner principal, registry version, eligibility evidence and assignment rationale;
- execution provider(s), required capabilities, constraints and independence requirements;
- dependencies, assumptions, risk, budget, time limits and data classification;
- delegation/work-package map and inherited parent constraints;
- approval requirements and WARP GATE action bindings;
- stop/escalation conditions, evidence requirements and independent closure criteria.

The existing subject-first policy is a useful deterministic assignment rule, but its role labels and caller-supplied candidate list are not a trusted identity or provider registry. A non-empty objective/rationale is not semantic proof of alignment. A trusted alignment check and host-attested registry are required before a task can become OWNED.

No eligible owner means the task remains unowned/blocked and a capability-gap task is created for the configured governance queue. If no valid fallback principal exists, fail closed. Do not invent agent identities, silently assign the requester, or let ORCH self-appoint.

Parent owners retain integration accountability. Each child work package has one owner and may narrow—but never widen—parent scope. Provider failover does not transfer ownership. Owner handoff requires incoming acceptance and preserves prior state, evidence, blockers, decisions, approvals and scope version.

## 6. Canonical lifecycle

Use the established state machine:

`CREATED → INTAKE → OWNED → PRESCANNED → ANALYZED → PLANNED → AWAITING_APPROVAL → AUTHORIZED → EXECUTING → VALIDATING → COMPLETED`

Exception states: `BLOCKED`, `REJECTED`, `NEEDS_REAPPROVAL`, `RECOVERING`, `FAILED`, `CANCELLED`.

Every transition has an actor, prior state, next state, reason, contract version, correlation ID, timestamp, evidence pointer and policy check. Invalid transitions fail closed. A state label is never evidence that a gate actually passed.

### 12 GAP Cycle — canonical sequence

The canonical 12 GAP Cycle remains:

1. G — Gap
2. A — Analysis
3. P — Paralysis
4. R — Root Cause
5. S — Shape
6. O — Optimization
7. P — Provision
8. B — Build
9. T — Test
10. V — Validate
11. C — Close
12. E — Evolve

Run Flow Integrity Audit before Provision, Build, Test and Close. Check ordering, completeness, dependencies, governance, evidence, recovery and objective alignment. Conditional steps remain conditional; do not force CRAFT or approval when their trigger is absent.

**Naming correction:** M03's G1–G12 table is an activation-readiness checklist, not the 12 GAP Cycle. Rename/reference it as the **M03 Activation Gate Matrix** to prevent two incompatible 12-stage systems from being treated as the same framework. Map each activation gate to one or more canonical 12 GAP stages.

## 7. L4 and L5 operating contract

### L4 — governed autonomy (qualification target)
- authenticated actor and tenant identity;
- trusted owner and provider registries;
- complete objective–subject–capability–dependency–governance alignment;
- exactly one accountable Task Owner;
- mandatory prescan and evidence provenance;
- typed plan, bounded work packages and valid state transitions;
- exact WARP GATE authorization before every protected action;
- human approval where required;
- idempotency, bounded retries, cancellation, reconciliation and recovery;
- independent validation and audit before closure;
- zero unauthorized execution and no silent scope expansion.

### L5 — adaptive autonomy (evolution target)
- proactive, evidence-backed gap and risk discovery;
- adaptive task-force composition and provider routing using measured performance;
- prediction of dependency, capacity and failure risks;
- optimization against multi-objective benchmarks without security trade-offs;
- evidence-driven owner/provider reassignment proposals with immutable history;
- controlled learning and replay against known baselines;
- rollback, drift detection and safe adaptation;
- measurable improvement across THINK, KNOW, ACT, GOVERN, ADAPT, COMPANION and EVOLVE.

L5 may recommend an adaptation. It cannot change its own authority, policy, trust roots, required approvals, audit independence or security invariants. Governance changes require a separately reviewed and authorized release.

## 8. Milestone build sequence

| Milestone | Build objective | Exit evidence |
|---|---|---|
| M00 — Baseline & Reconciliation | Read-only inventory of all relevant branches, PR stacks, runtime contracts and existing tests; choose integration base | Component map, branch dependency graph, duplication report, approved integration plan |
| M01 — Identity & Tenant Trust | Select one provider through an ADR; trusted user/tenant/session adapter; cross-tenant isolation | Session lifecycle, revocation/membership tests, cross-tenant and cross-user denial |
| M02 — Ownership & Registries | OSC, semantic objective/subject alignment, owner registry, provider registry, eligibility and handoff | Exactly one eligible owner; trusted registry attestations; fail-closed fallback tests |
| M03 — WARP GATE | Canonical grant contract, host signature/issuer verification, exact binding, approval, nonce consumption | Negative-path matrix, replay test, expiry/binding mismatch tests, durable decision reference |
| M04 — Trusted Runtime | Six host dependencies attested and healthy in the target environment | Environment-bound, expiring attestations; `ready_for_review`; activation remains false |
| M05 — Durable Orchestration | Task store, event log, state machine, queue/locking, idempotency, checkpoints and recovery | Concurrent-run, replay, crash, retry, cancellation and reconciliation tests |
| M06 — Scan & Evidence | Composable prescan, C-INSPECTOR/CME evidence model, gap detection | Reproducible source hashes, freshness/provenance and no-write prescan tests |
| M07 — Compiler & COSMAXX | Typed dependency plan and recommendation-only optimization | Schema/version tests, deterministic plan tests, benchmarked reuse/impact/security |
| M08 — Routing & Execution | Health-aware load balancing and bounded capability runtime | Capability attestation, least privilege, exact grant binding, postcondition verification |
| M09 — Validation, Audit & CRAFT | Independent acceptance, audit, blocker triage and remediation chain | Independent gate tests, tamper-evident event evidence, owned blocker closure |
| M10 — L4 Qualification | End-to-end governed workflow across all seven domains and build types BT-01–BT-04 | Reproducible qualification suite, threat model, operator runbook, independent review |
| M11 — L5 Evolution | Adaptive routing, proactive detection, safe learning and rollback | Before/after benchmarks, drift/rollback tests, governance invariants preserved |

Dependencies are strict: M02 depends on M01; M03 depends on trusted identity; M04 depends on M03 contracts; M05 protected dispatch depends on M01–M04; M06/M07 feed M05; M08 requires M03/M04/M05; M09 gates closure; M10 requires all L4 dependencies; M11 follows successful L4 qualification.

## 9. Existing repository work — reuse and reconciliation map

Observed open draft PRs and branches are separate workstreams, not one integrated release:

| Existing work | Reuse decision | Integration constraint |
|---|---|---|
| PR #18 — automatic task ownership | Reuse deterministic subject-first assignment and role separation | Caller-supplied providers are not trusted registry evidence |
| PR #21 — objective/subject alignment | Reuse as ownership-policy refinement | It is parallel to M03/M04 stack; reconcile with #18 before integration |
| PR #19 — M03 WARP GATE contract | Reuse stronger actor/tenant/workflow/step/capability/action/scope/digest/policy/risk/approval binding | Host cryptography, approval persistence, nonce consumption and audit remain external |
| PR #20 — M04 trusted runtime readiness | Reuse six-dependency readiness gate | It is based on an earlier M03 parent commit; reconcile branch ancestry before integration |
| PR #11/#17 — COSMAXX runtime adapter and hardening | Reuse recommendation-only optimizer contracts and failure handling | Never treat optimizer authorization as permission to execute recommendations |
| PR #15 — earlier WARP GATE workflow adapter | Compare, do not duplicate | Earlier grant binding is narrower; M03 contract is the stronger target |
| M6 orchestration and Ownership Scope documents | Retain as architecture baseline | Runtime implementation remains separate from design |
| Better Auth T3 branch | Retain as a provider adapter candidate | App-hosted auth schema, mail/recovery and operational controls remain incomplete |
| Neon Auth T4 branch | Retain as an alternative provider adapter candidate | Preview only; beta SDK, Next.js 16 peer requirement, email verification disabled |
| Unified Runtime v1 | Reuse compatible bounded runtime and Android bridge contracts after review | Separate branch; reconcile schema, API and dependency versions before porting |

The four PRs #18–#21 were observed as open drafts. Their recorded GitHub Actions check-runs reported success at the inspected head commits. This validates those branch checks only; it does not validate the current M6 hardening branch, prove integration compatibility, or certify production runtime behavior.

### Branch integration order

1. Freeze the canonical base and inventory branch ancestry/diffs.
2. Reconcile PR #18 with #21 into one ownership baseline; do not duplicate owner maps.
3. Reconcile PR #19 onto that ownership baseline, retaining the stronger WARP GATE binding.
4. Rebase/port PR #20 on the reconciled M03 head; preserve the six-dependency readiness contract.
5. Compare Better Auth T3 and Neon Auth T4 against one provider-neutral IdentityProvider interface. Select one through an ADR; do not combine two session authorities.
6. Port compatible M6 security hardening and unified runtime components only after schema, API, dependency and test compatibility review.
7. Keep all work on isolated feature branches and stacked draft PRs. No merge to main, production migration, credential change, or deployment is implied by this blueprint.

## 10. Known critical gaps and design decisions

1. **Identity provider choice is unresolved.** Better Auth T3 uses app-hosted auth and a Next.js 15 baseline. Neon Auth T4 uses a preview provisioned auth backend, beta SDK and Next.js 16. Preserve a provider-neutral interface until the ADR compares lifecycle, tenant membership, revocation, mail verification, support, cost and operational risk.
2. **WARP GATE is not operational on the M6 hardening branch.** Its current interface denies by default. M03 defines a stronger contract, but host cryptographic verification, replay-safe nonce store, policy service and durable audit are not supplied by the contract alone.
3. **Trusted runtime is a readiness probe, not provisioning.** M04 tests host-supplied adapters and cannot create the six dependencies or activate production.
4. **Owner/provider registries are not yet trusted runtime services.** Static subject maps and caller-supplied candidates are policy inputs, not attested principal/provider identities.
5. **Durable orchestration is missing.** A typed policy function is not a durable queue, transactional lifecycle, distributed lock, event store or recovery engine.
6. **Evidence and audit need durable tamper-evident storage.** In-memory references and documentation are not runtime provenance.
7. **API hardening is incomplete.** The M6 branch still needs a real WARP GATE adapter, rate limiting/abuse controls, auth email verification/recovery policy, database migrations, CI and end-to-end isolation tests before production exposure.
8. **Validation independence must be enforced.** The executor cannot be the sole validator or auditor for consequential work.

## 11. Seven-domain qualification matrix

| Domain | L4 evidence | L5 evidence |
|---|---|---|
| THINK | Correct task interpretation and deterministic plans | Better decisions measured against baseline cases |
| KNOW | Source-backed, fresh, traceable evidence | Proactive knowledge-gap detection and calibrated confidence |
| ACT | Authorized, bounded, idempotent execution | Adaptive routing with verified postconditions and rollback |
| GOVERN | Complete identity, ownership, approval, WARP GATE and audit | No governance drift under adaptation or adversarial tests |
| ADAPT | Safe recovery and approved replanning | Measured improvement without changing trust boundaries |
| COMPANION | Clear status, uncertainty, approval requests and handoffs | Context continuity and useful anticipation without autonomous overreach |
| EVOLVE | Versioned lessons and regression baselines | Reproducible learning gains, drift detection and safe rollback |

Qualification requires every domain to meet its threshold; a high aggregate score cannot compensate for a failing GOVERN or ACT domain. Proposed benchmark thresholds must be fixed before evaluation and supported by reproducible test data.

## 12. Release and closure gates

A flagship milestone can be called complete only when:
- the owning task has a complete OSC and accepted accountable owner;
- prescan and evidence are complete and scope-aligned;
- code changes are reviewed and reproducibly built;
- automated unit, integration, security, tenant-isolation, failure-path and regression tests pass;
- WARP GATE authorization is verified against the actual host implementation for protected work;
- required human approvals are recorded;
- independent Validation passes;
- independent Audit passes;
- recovery and rollback paths are demonstrated;
- the final evidence package identifies exact commit, environment, test outputs, unresolved risks and approval references.

Documentation, a passing fake-adapter test, a green branch CI run, or a readiness result alone is never production activation or L4/L5 certification.

## 13. Immediate next execution package

**M00 — Flagship Baseline Reconciliation** is the next accountable build package.

Objective: establish one evidence-backed integration map for the existing open PR stack and M6 runtime hardening work without duplicating engines or modifying main.

Required outputs:
1. branch/PR ancestry and changed-file dependency map;
2. canonical module and responsibility registry;
3. identity-provider ADR comparing Better Auth T3 and Neon Auth T4;
4. merged ownership and WARP GATE contract target, with unresolved host dependencies explicit;
5. schema/API/runtime compatibility report;
6. exact M01–M04 work packages with one verified Task Owner each;
7. 12 GAP Flow Integrity Audit and approval-ready implementation plan.

M00 is read-only except for its documentation artifact. No cherry-pick, rebase, merge, migration, credential operation, deployment or protected execution is authorized by this blueprint.

## 14. Status statement

This document is an architecture refinement and integration plan. It does not claim the flagship runtime is implemented, that the separate draft PRs are integrated, that WARP GATE is operational, or that COSMOS has passed L4/L5 qualification. Main remains untouched.
