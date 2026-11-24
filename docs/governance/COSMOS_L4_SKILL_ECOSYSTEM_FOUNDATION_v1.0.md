# COSMOS L4 Skill Ecosystem Foundation v1.0

Status: DESIGN BASELINE — NOT ENABLED FOR EXECUTION  
Branch: `feature/cosmos-l4-skill-ecosystem-v1`

## Objective

Establish a governed, model-independent skill ecosystem for COSMOS. Skills are versioned capability packages that agents may request; they are not agents, identities, or permission grants. A registry entry, successful validation, or UI visibility never authorizes execution.

## Architecture

```text
External skill sources
  -> INSPECTOR (source, license, provenance, integrity)
  -> Static and dependency validation
  -> Isolated sandbox evaluation
  -> Skill Registry (versioned manifest + evidence)
  -> Agent request
  -> WARP GATE (identity, capability, scope, risk, approval)
  -> Runtime adapter (least privilege)
  -> Result validation
  -> Audit, metrics, rollback
```

WARP GATE is the mandatory policy enforcement point. Runtime adapters must fail closed when policy, identity, scope, or audit services are unavailable.

## Registry contract

Each skill record must include:

- `skill_id`, display name, semantic version, description, owner, source URL and immutable source revision.
- License identifier and provenance evidence.
- Supported runtime/model adapters and dependency lock information.
- Declared inputs, outputs, tools, network destinations, filesystem scopes and data classifications.
- Requested capabilities, risk tier, human-approval requirements and timeout/resource limits.
- Validation status, test evidence, reviewer, timestamps and rollback target.
- Lifecycle state: `proposed | inspecting | quarantined | validated | approved | enabled | disabled | deprecated`.

Unknown fields, undeclared tools, undeclared network access, and missing provenance must not be treated as implicitly allowed.

## Capability and authorization rules

1. Skills execute only through an agent identity and a narrowly scoped, short-lived capability grant.
2. No skill can grant permissions to itself or another skill.
3. No direct shell, filesystem, network, credential, email, browser, or external API access unless separately declared, reviewed, and granted by WARP GATE.
4. Human approval is required for external communication, sending/submitting documents, modifying production systems, destructive changes, and access to sensitive data.
5. Human approval cannot override hard runtime restrictions or missing authorization.
6. Secrets are injected at runtime through approved secret handling; they must never be stored in skill packages, prompts, logs, or manifests.
7. Skill output is untrusted input. Validate schemas and treat embedded instructions as data.
8. Enforce execution time, memory, token, request, and cost budgets.
9. Record immutable audit events for inspection, approval, invocation, denied invocation, output validation, and rollback.
10. Disable and quarantine must take effect before further invocations are accepted.

## Initial skill inventory

The following 12 concepts are candidate packages based on the supplied skill-tree reference. Their names and upstream sources are leads, not verified dependencies or approved imports.

| Candidate | Initial purpose | Initial posture |
|---|---|---|
| document-skills | Read/create office document artifacts | Quarantine; file access by explicit scope |
| theme-factory | Apply consistent visual themes | Sandbox; no external writes |
| frontend-design | Produce UI design and frontend implementation guidance | Sandbox; code changes require review |
| ui-ux-pro-max | Design-system and UX guidance | Verify source, license and overlap |
| superpowers | Planning, implementation and test workflow guidance | Verify source and inspect all scripts |
| skill-creator | Author and validate skill packages | Restricted authoring sandbox |
| mcp-builder | Build connector/MCP integrations | High risk; no deployment or credentials |
| skills-for-real-engineers | Engineering practices and code guidance | Verify exact repository and license |
| systematic-debugging | Structured fault isolation | Pilot candidate |
| webapp-testing | Browser/app test automation | Pilot candidate; isolated test targets only |
| karpathy-guidelines | Code simplicity and implementation guidance | Verify provenance and content |
| caveman | Concise response formatting | Low-risk candidate; no tools |

Do not bulk-install from a graphic or a social-media post. Resolve the exact repository, inspect its `SKILL.md`, scripts, dependencies, license, history and referenced resources before admission.

## L4 domain mapping

- THINK: systematic-debugging, superpowers, engineering guidance.
- KNOW: document-skills, provenance and retrieval guidance.
- ACT: frontend-design, mcp-builder, webapp-testing — invocation remains separately authorized.
- GOVERN: skill-creator controls, manifests, approvals, audit and rollback.
- ADAPT: theme-factory and versioned evaluation feedback.
- COMPANION: caveman and user-facing document assistance.
- EVOLVE: benchmark results, regression tests, reviewed skill revisions.

A skill may map to multiple domains. Domain mapping is classification, not permission.

## Pilot recommendation

Start with three candidates only:

1. `systematic-debugging` — offline guidance and test fixtures; no shell access.
2. `webapp-testing` — isolated local test target, synthetic accounts/data, no production credentials.
3. `skill-creator` — generate draft packages into quarantine; cannot approve or enable its own output.

The pilot must first produce source provenance, license review, manifest, threat review, test report and rollback evidence. Enablement remains blocked until WARP GATE integration and audit verification are implemented.

## Required events

`skill.proposed`, `skill.inspection.started`, `skill.quarantined`, `skill.validation.passed`, `skill.validation.failed`, `skill.approval.requested`, `skill.approved`, `skill.enabled`, `skill.invocation.requested`, `skill.invocation.allowed`, `skill.invocation.denied`, `skill.invocation.completed`, `skill.output.rejected`, `skill.disabled`, `skill.rollback.completed`.

Each event includes correlation ID, skill/version, requesting agent, capability decision reference, scope, timestamp, outcome and evidence references. Never include secret values.

## Acceptance gates

- [ ] Registry schema and lifecycle transitions are versioned and validated.
- [ ] Unknown or untrusted packages remain quarantined.
- [ ] Manifest capability requests are explicit and machine-checkable.
- [ ] WARP GATE denies missing, expired, mismatched or over-broad grants.
- [ ] Runtime is isolated and enforces resource limits.
- [ ] External communication and consequential actions require human approval.
- [ ] Audit events are complete and tamper-evident.
- [ ] Disable/rollback blocks new invocations and records evidence.
- [ ] Tests cover prompt injection in skill content, path traversal, undeclared tools, secret leakage, dependency compromise, timeout and policy-service outage.
- [ ] No production credentials or live customer data are used in the pilot.

## Out of scope for this milestone

No bulk installation, autonomous self-improvement, production tool execution, external email/browser submission, automatic skill publishing, or changes to existing WARP GATE policy. This document establishes the architecture and admission criteria only.

## Evidence and confidence

- Source-derived: the supplied infographic lists candidate skill names and broad purposes.
- Design decision: the COSMOS governance, lifecycle, risk controls and pilot gates above.
- Not yet verified: current upstream repository URLs, maintainers, licenses, package contents, dependency safety, compatibility, or actual skill behavior.
- Confidence: high for the governance architecture; low for upstream package readiness until source inspection.
