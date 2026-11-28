# Automatic Task Ownership Policy v1.0

## Purpose

Assign a responsible specialist to each task before execution while preserving the separation between task ownership, orchestration, execution, blocker resolution, validation, evidence, and governance.

## Ownership contract

- **Task owner:** the specialist responsible for the task outcome, selected by task category.
- **Orchestrator:** ORCH coordinates the task lifecycle and remains accountable for chain coordination.
- **Provider router:** TPO selects and routes the task to providers.
- **Execution provider:** an explicitly selected runtime that satisfies every required capability.
- **Blocker provider:** CRAFT diagnoses and resolves verified blockers.
- **Validation provider:** 12 GAP CYCLE checks lifecycle acceptance.
- **Governance provider:** WARP GATE independently authorizes side effects.
- **Evidence provider:** CME / Evidence Engine records provenance and results.

## Default task-owner routing

| Category | Task owner |
|---|---|
| architecture | SHAPE |
| optimization | COSMAXX |
| runtime_hardening | COSMAXX |
| development | DEVOPS |
| operations | DEVOPS |
| security | DEFENDER |
| threat_protection | FORCEFIELD |
| workflow_integration | HOOKS |
| blocker | CRAFT |
| validation | 12_GAP_CYCLE |
| discovery | DISCOVERY |
| general | ORCH |

ORCH and TPO are not interchangeable: ORCH coordinates the chain; TPO performs provider selection and routing. The category specialist owns the task outcome.

## Fail-closed execution selection

The policy selects an execution provider only when:
1. The provider candidate has a non-empty identifier.
2. Its capability list is valid.
3. It satisfies every required capability.
4. Selection is unambiguous, or the caller supplies a preferred provider that passes the same capability check.

Missing candidates, missing capabilities, ambiguous selection, invalid acceptance criteria, or an invalid category block assignment.

## Authorization boundary

- Read-only assignments may be marked dispatch-ready once a valid execution provider is selected.
- Side-effect assignments require WARP GATE authorization and remain non-dispatchable at this policy layer.
- Consequential assignments additionally require explicit human approval.
- This module does not contact WARP GATE, create grants, execute tasks, merge pull requests, provision resources, or deploy software. An external governed runtime must verify authorization before execution.

## Integration status

This is a deterministic TypeScript assignment policy exported from the COSMAXX library. It is not yet a persistent task queue, autonomous scheduler, provider registry, or production orchestration service. Provider candidates and capabilities must be supplied by a trusted caller; they are not self-attested by this module.

## Validation

Covered by automated tests for specialist routing, ORCH/TPO separation, ambiguous provider selection, capability checks, preferred-provider validation, side-effect authorization boundaries, human approval requirements, and missing acceptance criteria.
