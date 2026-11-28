# COSMOS M6 — Ownership Scope Contract
Status: Architecture design provisioned; runtime implementation pending
Applies to: Intelligence Orchestrator, Task Owner, Task Provider, Compiler, Load Balancer, WARP GATE, Validation, Audit
Parent specification: docs/architecture/cosmos-m6-l4-l5-autonomous-task-orchestration.md

## 1. Gap statement

The current orchestration specification requires automatic Task Owner assignment and defines role boundaries, but it does not yet define a complete ownership contract. In particular, it does not specify how an objective becomes a bounded ownership scope, how owner eligibility is evaluated, how authority differs from accountability, how delegated work inherits constraints, how handoffs preserve accountability, or how scope drift is detected and controlled.

This is an architecture-level gap. The repository prescan found no runtime task domain, owner registry, provider registry, state machine, or WARP GATE integration. This document therefore provisions the missing design, not executable ownership automation.

## 2. Ownership design objective

Every executable task must have exactly one accountable Task Owner at each point in its lifecycle. The owner is accountable for objective alignment, scope integrity, coordination, remediation, evidence completeness, and closure readiness. The owner is not automatically the executor, approver, security authority, or auditor.

A task must never gain permissions merely because an owner was assigned. Accountability, capability, delegation, and authorization are separate dimensions.

## 3. Ownership Scope Contract (OSC)

The Compiler must create a versioned Ownership Scope Contract before the task enters OWNED. The contract contains:

1. **Task identity:** immutable task ID, parent task/milestone ID, creation source, correlation ID, and contract version.
2. **Objective alignment:** originating directive, intended outcome, measurable acceptance criteria, and explicit statement of how this task contributes to the parent objective.
3. **Scope boundary:** in-scope deliverables, explicit exclusions, affected systems/repositories/environments, allowed paths/resources, and prohibited areas.
4. **Accountable owner:** stable principal ID, owner type (human, service, or agent), role, capability evidence, assignment reason, and assignment timestamp.
5. **Owner responsibilities:** coordination, decision logging, dependency tracking, checkpoint reporting, blocker escalation, remediation ownership, and closure proposal.
6. **Delegation map:** child work packages, each with one accountable subtask owner, executor/provider, bounded deliverable, dependencies, and evidence requirements.
7. **Capability requirements:** required skills, provider constraints, availability/capacity needs, and conflict-of-interest or independence requirements.
8. **Authority boundary:** actions the owner may coordinate or propose versus actions requiring WARP GATE authorization or human approval.
9. **Constraints:** policy labels, data classification, privacy/security requirements, budget/resource limits, time constraints, and environment restrictions.
10. **Dependencies and assumptions:** upstream/downstream dependencies, assumptions, unresolved questions, and evidence references.
11. **Stop and escalation conditions:** scope mismatch, missing identity, unavailable eligible owner, failed prescan, security finding, budget limit, unexpected side effect, or changed risk.
12. **Evidence and closure:** required artifacts, validation criteria, audit criteria, retention classification, and closure authority.

Missing mandatory fields prevent the contract from being finalized. Unknowns must be explicit; they must not be silently inferred as permissions or scope.

## 4. Roles and non-overlapping accountability

- **Creator / Requester:** supplies intent, constraints, and acceptance expectations; does not automatically become the Task Owner.
- **Intelligence Orchestrator:** coordinates intake and assignment; is not automatically the Task Owner and cannot grant permissions.
- **Task Owner:** the single accountable principal for one task objective and its scope contract.
- **Task Provider:** finds and assembles eligible capabilities; remains accountable for provider assignment quality, not for the task outcome unless separately assigned as Task Owner.
- **Subtask Owner:** owns one bounded child work package. Parent Task Owner retains integration and parent-outcome accountability.
- **Executor / Provider:** performs authorized work within its delegated work package; execution does not imply ownership.
- **WARP GATE:** exclusively evaluates authorization and policy for protected actions.
- **Approver:** supplies required human approval for designated consequential actions; approval does not transfer task ownership.
- **Validator:** independently tests acceptance; cannot be the sole approver of its own work where independence is required.
- **Auditor:** independently verifies governance and evidence; cannot rewrite the task's authorization history.

No role may collapse these boundaries merely to simplify routing.

## 5. Automatic owner assignment

The Orchestrator requests candidate principals from the capability/owner registry. A candidate is eligible only when all required checks pass:

- stable principal identity is registered and active;
- role and demonstrated capability match the task's objective and complexity;
- candidate can accept the complete bounded scope or a clearly defined subtask;
- required environment, data, and operational eligibility are satisfied;
- capacity and health are sufficient;
- no prohibited conflict or independence violation exists;
- candidate's assigned responsibility does not require permissions it does not hold.

The assignment decision records candidate set, eligibility results, selected owner, rationale, timestamp, and registry version. Selection may optimize for fit, continuity, load, cost, latency, and resilience only among eligible candidates.

**No eligible candidate:** do not invent an agent, silently assign the requester, or let the orchestrator self-appoint. Route the assignment failure to the configured governance/fallback owner queue and create a capability-gap remediation record. If no valid fallback principal is configured, fail closed before the task enters OWNED; raise a configuration blocker for an authorized administrator. An unowned task may not execute.

Automatic assignment does not require repeated creator interaction when the objective and scope are sufficient, but missing essential scope input must be returned for clarification.

## 6. Objective-to-scope alignment and drift control

Before assignment, the Compiler maps every deliverable to:
- a parent objective or approved acceptance criterion;
- a measurable completion condition;
- an allowed system/resource boundary;
- a named accountable owner.

A deliverable without a traceable objective link is marked out-of-scope or returned for decision. Every work package inherits the parent constraints by default. A child may narrow its scope but may not widen parent scope, data access, budget, environment, or permissions.

At each checkpoint, compare planned work and actual changes with the contract. Detect:
- **scope omission:** required objective work has no owner/work package;
- **scope creep:** work lacks objective linkage or exceeds the approved boundary;
- **ownership drift:** accountable owner is missing, inactive, overloaded, or no longer eligible;
- **authority drift:** requested action exceeds granted permissions or approval;
- **dependency drift:** assumptions or upstream conditions changed;
- **evidence drift:** required evidence is missing, stale, or disconnected from the deliverable.

Scope changes require a new contract version, impact analysis, owner alignment, prescan where relevant, and renewed WARP GATE authorization/approval when the change affects protected actions. The prior contract remains immutable in the audit history.

## 7. Delegation, handoff, and continuity

- The parent Task Owner may delegate bounded work packages but cannot delegate away parent accountability.
- Every child task has exactly one accountable Subtask Owner.
- A provider change does not itself change task ownership.
- A Task Owner change requires an explicit handoff event: outgoing owner, incoming owner, reason, effective time, current state, open decisions, blockers, dependencies, scope version, approvals, evidence pointers, and acceptance by the incoming principal.
- Until handoff is accepted, the existing owner remains accountable if still active. If the owner becomes unavailable, the configured fallback governance owner assumes interim coordination only within its pre-authorized scope; WARP GATE must independently check any protected action.
- If no valid incoming owner can be established, pause affected execution and enter BLOCKED or RECOVERING. Do not erase ownership history or silently reassign.
- On owner departure, revoke or re-evaluate access independently through the identity/authorization system; ownership does not preserve access rights.

## 8. Blockers and remediation ownership

A blocker is a first-class task linked to the blocked parent task. It receives:
- a unique blocker ID and severity;
- one accountable remediation owner;
- a bounded resolution objective and acceptance criteria;
- dependencies and evidence;
- an escalation deadline or checkpoint;
- a clear relationship to the parent task.

The parent Task Owner remains accountable for tracking the blocker and deciding whether independent, already-authorized work can continue. The remediation owner cannot broaden the parent scope. If a blocker concerns missing capability, the Task Provider owns the capability-discovery/remediation work package; the parent Task Owner retains parent delivery accountability.

## 9. Authorization boundary

Task ownership is accountability, not authorization. The Task Owner may plan, coordinate, recommend, and request actions within the contract. WARP GATE must independently validate principal identity, resource, action, scope, policy, risk, environment, and approval requirements before protected execution.

- Assignment never creates a permission.
- Delegation never increases the parent's authority.
- Load Balancer routing never grants permission.
- COSMAXX optimization never waives policy.
- Human approval cannot override a runtime security prohibition.
- Any material scope, principal, resource, or risk change triggers authorization re-evaluation.
- Missing or ambiguous authorization fails closed.

## 10. Lifecycle integration

Ownership checks are required at these points:

| Lifecycle point | Ownership requirement |
|---|---|
| CREATED / INTAKE | Capture requester intent; do not imply owner or permission |
| OWNED | Finalize OSC and assign exactly one eligible Task Owner |
| PRESCANNED | Owner confirms findings remain aligned to objective; scanner remains independent |
| ANALYZED / PLANNED | Map all work packages, dependencies, acceptance criteria, and subtask owners |
| AWAITING_APPROVAL | Owner requests approvals; approver remains distinct |
| AUTHORIZED | WARP GATE records action-specific authorization; owner assignment is insufficient |
| EXECUTING | Enforce delegated scope and checkpoint ownership/authority drift |
| BLOCKED / RECOVERING | Assign remediation owner and preserve parent accountability |
| VALIDATING | Owner submits evidence; independent validator decides acceptance |
| COMPLETED | Audit verifies ownership history, contract versions, handoffs, approvals, evidence, and closure conditions |

Invalid or missing ownership must prevent transition into OWNED or EXECUTING, as appropriate. A valid owner cannot make an otherwise invalid state transition valid.

## 11. Required event and data model

Minimum logical records (physical schema to be designed during implementation):

- `task`: task ID, parent ID, objective, state, priority, created timestamp.
- `ownership_scope_contract`: version, scope fields, constraints, acceptance criteria, evidence references, effective timestamps.
- `task_assignment`: task ID, principal ID, role, eligibility evidence, rationale, assignment state, effective period.
- `work_package`: parent task ID, bounded scope, deliverable, dependencies, subtask owner, provider.
- `ownership_handoff`: old/new principal, reason, acceptance, effective time, carried-forward context.
- `scope_change`: prior/new contract version, changed fields, impact analysis, approvals, authorization re-evaluation.
- `task_event`: actor, event type, prior/new state, contract version, correlation ID, timestamp, evidence pointer.
- `blocker_link`: parent task, blocker task, remediation owner, status, resolution evidence.

Use append-only or tamper-evident event history for consequential transitions. Store references to secrets rather than secret values. Data retention and access policy must be defined before deployment.

## 12. Acceptance criteria

The ownership-scope capability is not complete until automated tests demonstrate:

1. Every executable task has exactly one active accountable Task Owner.
2. No task enters OWNED without a complete, versioned OSC.
3. An owner cannot receive permissions from assignment or delegation.
4. Ineligible, inactive, or over-capacity candidates are rejected.
5. No-candidate conditions route to the configured fallback/capability-gap path and fail closed if no valid fallback exists.
6. Every child work package has one owner and inherits parent constraints.
7. Scope expansion is detected and requires contract versioning and required approvals/reauthorization.
8. Provider changes do not silently change Task Owner.
9. Owner handoff preserves state, evidence, approvals, blockers, and immutable history.
10. Blockers have remediation owners while parent accountability remains intact.
11. Validator and auditor independence rules are enforced.
12. Invalid lifecycle transitions and missing ownership are rejected.
13. Every ownership decision is traceable to evidence, registry version, and rationale.
14. Runtime tests verify that cross-user/task boundaries cannot be bypassed.

## 13. 12 GAP Cycle execution record

### G — Gap
The orchestration specification says “assign one accountable Task Owner” but lacks a complete ownership scope contract, eligibility rules, authority separation, delegation inheritance, handoff protocol, drift detection, and ownership acceptance tests.

### A — Analysis
The static prescan found no task model, owner/provider registry, state machine, authorization integration, or audit store in the current repository. Existing documentation establishes roles and lifecycle states but does not operationalize their ownership boundaries.

### P — Paralysis
The flow can stall or make unsafe assumptions when no eligible owner exists, an owner becomes unavailable, scope changes, or a provider is mistaken for the accountable owner. The safe resolution is an explicit fallback queue and fail-closed behavior, not synthetic agent identities or permission escalation.

### R — Root Cause
Ownership is represented as a role label in the architecture, not as a versioned, objective-aligned contract with enforceable state transitions and evidence. Accountability, execution, capability provision, approval, and authorization are insufficiently separated.

### S — Shape
Define the Ownership Scope Contract, role boundaries, automatic assignment eligibility, parent/child inheritance, scope drift controls, handoff continuity, blocker ownership, and lifecycle gates as specified above.

### O — Optimization
Use one reusable contract and one assignment policy across task types. Keep the owner registry and provider registry distinct; reuse WARP GATE for authorization; preserve the existing lifecycle; avoid creating a separate ownership engine or duplicating policy logic.

### P — Provision
Provision this architecture document on the existing feature branch. No production database schema or runtime code is changed by this document-only provisioning step.

### B — Build
The design artifact is built. Runtime implementation is deliberately deferred to a separately authorized milestone: typed contracts and event model, owner/capability registry, deterministic assignment policy, lifecycle enforcement, WARP GATE integration, and persistence.

### T — Test
Design-level test cases are defined in Section 12. No automated test suite was executed because this step did not change runtime code and the repository prescan found no test harness.

### V — Validate
Static review confirms that the design distinguishes accountability from permission, defines a single owner per executable task, covers no-candidate and handoff paths, preserves parent scope, and includes auditable acceptance criteria. GitHub retrieval after commit is the artifact-integrity check. Runtime behavior remains unverified.

### C — Close
Close the documentation gap only after the committed file is re-fetched and verified. Do not close the runtime ownership capability, M6 milestone, or L4/L5 certification. Those remain open until implementation, automated tests, independent validation, and audit pass.

### E — Evolve
Feed unresolved implementation work into M6: (1) typed ownership contract and event model, (2) owner/capability registry and assignment policy, (3) state-machine enforcement and scope drift detection, (4) handoff/blocker recovery, (5) WARP GATE integration, (6) independent validation and audit. Re-run this cycle only when new evidence changes the gap; preserve accepted decisions unless evidence justifies revision.

## 14. Flow Integrity Audit

- Sequence: all 12 stages are present and ordered G → A → P → R → S → O → P → B → T → V → C → E.
- Completeness: ownership assignment, scope definition, authority, delegation, handoff, blocker recovery, evidence, validation, and evolution are covered.
- Dependencies: identity and capability registry precede assignment; WARP GATE precedes protected execution; independent validation and audit precede runtime closure.
- Governance: no self-granted permissions, no synthetic owners, no bypass of approval or security restrictions.
- Evidence: prescan findings and the architecture specification support the gap statement; runtime evidence is explicitly absent.
- Recovery: no-owner, owner-unavailable, scope-drift, blocker, and failed-validation paths are defined.
- Scope: this provision is documentation-only; unrelated security and application gaps remain out of scope.

## 15. Provisioning boundary and next step

This document closes the architecture-definition gap only. It does not implement owner assignment, grant access, modify database schema, run tasks autonomously, or certify L4/L5.

Next implementation package: **M6 Ownership Runtime Foundation**. It must begin with a fresh repository prescan and an approved change plan; define typed contracts and tests first; integrate identity and WARP GATE before any protected execution. Main remains untouched.
