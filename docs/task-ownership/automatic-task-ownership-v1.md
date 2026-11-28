# Automatic Task Ownership Policy v1.1 — Flagship L4/L5

## Purpose

Assign one accountable Task Provider using explicit objective–subject–capability alignment. Preserve the separation between task ownership, orchestration, provider routing, execution, blocker resolution, validation, evidence, and governance.

## Mandatory intake contract

Every assignment must supply:

- **Objective:** a concrete, outcome-oriented statement of what must be achieved.
- **Subject:** one registered COSMOS subsystem/domain that the objective directly affects.
- **Alignment rationale:** a concise explanation of why that subject is the correct ownership domain for the objective.
- **Category:** secondary classification for reporting and compatibility; it cannot override subject ownership.
- **Required capabilities:** the capabilities needed by the execution provider.
- **Acceptance criteria:** observable conditions that define completion.

Missing objective, subject, rationale, capabilities, or acceptance criteria blocks assignment. Unknown subjects remain unassigned; the policy must not silently fall back to a generic category owner.

## Objective–subject ownership registry

| Subject | Task Provider |
|---|---|
| architecture | SHAPE |
| governance | SHAPE |
| guidance | SHAPE |
| cosmaxx | COSMAXX |
| craft | CRAFT |
| devops | DEVOPS |
| security | DEFENDER |
| threat_protection | FORCEFIELD |
| workflow_integration | HOOKS |
| orchestration | ORCH |
| evidence | CME_EVIDENCE_ENGINE |
| validation | 12_GAP_CYCLE |
| discovery | DISCOVERY |
| general | ORCH |

Subject ownership is authoritative. Category routing is retained as secondary metadata and must not override a more precise subject assignment. The objective and alignment rationale are caller-supplied declarations; they are not proof that the caller is truthful. This policy verifies that the objective and rationale are non-empty and that the subject is registered; it does not semantically prove that the rationale matches the objective. A trusted host or a separately validated alignment component must perform that check before consequential execution.

## Unified provider responsibility contract

- **Task Provider:** one accountable specialist that owns the objective and outcome.
- **ORCH:** coordinates lifecycle, dependencies, and task-chain state.
- **TPO:** selects and routes providers; it does not replace task ownership.
- **Execution Provider:** verified runtime that satisfies every required capability.
- **Blocker Provider:** CRAFT diagnoses and resolves blockers.
- **Validation Provider:** 12 GAP CYCLE checks lifecycle acceptance.
- **Governance Authority:** WARP GATE independently authorizes side effects.
- **Evidence Provider:** CME / Evidence Engine records provenance and results.

These roles are distinct. The Task Provider does not grant execution authority. Provider candidates supplied to this policy are not a trusted registry.

## L4 — Deterministic governance

L4 requires explicit objective–subject alignment, one accountable Task Provider, capability-complete and unambiguous execution-provider selection, role separation, fail-closed behavior, evidence capture, and independently enforced authorization.

- Read-only work may be dispatch-ready only after a valid execution provider is selected.
- Side-effect work requires an exact WARP GATE authorization and remains non-dispatchable at this policy layer.
- Consequential work additionally requires explicit human approval where policy requires it.
- DENY, REQUIRE_APPROVAL, BLOCKED, malformed responses, missing grants, mismatched bindings, failed verification, replay, timeout, or unavailable governance services must block execution.

## L5 — Adaptive ownership within L4

L5 may evaluate validated outcome evidence, provider capability evidence, availability, dependencies, and historical performance to recommend a better-aligned owner or execution provider.

Reassignment must be explicit and auditable. Preserve the previous owner, proposed owner, objective, subject, rationale, evidence references, timestamp, and approval state. Consequential in-flight reassignment requires the applicable human approval and a fresh WARP GATE authorization for the changed execution binding.

L5 must never self-grant permissions, treat confidence as authorization, bypass WARP GATE, silently reassign consequential work, or turn a recommendation into execution.

## Failure states

| Condition | Required state |
|---|---|
| Missing objective or alignment rationale | ALIGNMENT_INSUFFICIENT |
| Unknown subject | UNASSIGNED |
| Missing specialist capability | SPECIALIST_DISCOVERY_REQUIRED |
| No eligible execution provider | EXECUTION_BLOCKED |
| Ambiguous execution provider | PROVIDER_SELECTION_AMBIGUOUS |
| WARP GATE denial or failure | DENIED / BLOCKED |
| Required human approval absent | AWAITING_APPROVAL |
| Acceptance criteria fail | REWORK_REQUIRED |
| Better owner identified | REASSIGNMENT_PROPOSED |

## Authorization boundary

This module assigns responsibility only. It does not contact WARP GATE, create grants, authenticate identities, maintain a durable task queue, execute tasks, merge pull requests, provision infrastructure, or deploy software. The host must enforce identity, trusted provider registration, authorization, durable audit, and replay protection.

## Validation

Tests cover subject-first ownership, category conflict, missing objective, missing alignment rationale, unknown subjects, provider ambiguity, capability checks, approval boundaries, and acceptance criteria.
