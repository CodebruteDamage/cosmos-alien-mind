# COSMOS Build Types and Profiles Standard v1.0

Status: Architecture standard — specification committed; runtime implementation remains milestone-gated.
Canonical platform: COSMOS Alien Mind.
Target architecture: Modular, governed, hybrid agentic AI platform.

## 1. Purpose

This standard defines the recognized COSMOS build types and build profiles. A build type describes the architectural capability being developed. A build profile describes the environment and release purpose in which that capability is built, tested, or operated. They are separate dimensions and must not be conflated.

This document establishes the recommended flagship scope and common acceptance requirements. It does not certify that the listed capabilities are already implemented.

## 2. Recognized build types

### BT-01 — CORE BUILD

Purpose: establish the central intelligence and orchestration foundation.

Scope:
- reasoning and planning interfaces;
- context management;
- evidence and memory interfaces;
- model-provider adapters;
- stable internal module contracts;
- health and diagnostic interfaces.

Acceptance criteria:
- core interfaces are versioned and documented;
- provider failures and timeouts have defined behavior;
- evidence provenance is retained where applicable;
- core modules can be tested without requiring every external provider;
- no core component bypasses governance for privileged execution.

### BT-02 — MODULAR BUILD

Purpose: develop independent engines and capabilities behind stable contracts.

Initial modules:
- CRAFT — blocker assessment and prioritization;
- COSMAXX — optimization recommendations;
- SHAPE — architecture refinement;
- COSMOS Inspector — repository and system inspection;
- CLC — lifecycle coordination;
- WARP GATE — authorization and execution governance.

Acceptance criteria:
- each module has a declared owner, version, inputs, outputs, errors and dependencies;
- modules are independently testable;
- integration is performed through reviewed interfaces;
- modules can be replaced or upgraded without wholesale repository merging;
- recommendations are distinct from execution authority.

### BT-03 — AGENTIC BUILD

Purpose: coordinate agents and delegated work under explicit capability boundaries.

Scope:
- agent registry and identity;
- capability declarations and grants;
- task orchestration and lifecycle;
- approval checkpoints;
- execution result capture;
- audit and revocation.

Acceptance criteria:
- every agent has a defined identity and allowed capability set;
- each privileged operation is independently authorized;
- task envelopes are scoped, expiring and replay-resistant where applicable;
- untrusted agent output is treated as data, not policy;
- human approval does not override runtime security restrictions;
- execution can be stopped, revoked and audited.

### BT-04 — HYBRID BUILD

Purpose: coordinate local devices and cloud services through secure, replaceable adapters.

Initial environments:
- Android Termux;
- Windows and Linux workstations;
- cloud APIs and managed services;
- Neon PostgreSQL and other explicitly configured data services.

Acceptance criteria:
- transport is authenticated and encrypted;
- device identity is revocable;
- local and cloud responsibilities are explicit;
- offline and reconnection behavior is documented;
- secrets are not embedded in source or logs;
- remote operations use allowlisted capabilities, never arbitrary shell payloads;
- local execution and cloud orchestration remain independently testable.

### BT-05 — ENTERPRISE BUILD

Purpose: support organizational and multi-user deployment.

Scope:
- identity and access management;
- tenant isolation;
- administrative controls;
- policy configuration;
- audit export and retention;
- operational monitoring.

Acceptance criteria:
- tenant boundaries are enforced at API and data layers;
- administrative privileges are least-privilege;
- access and policy changes are auditable;
- data retention and recovery requirements are documented;
- security and privacy review is completed before production use.

This type is a later extension, not a prerequisite for the first flagship integration candidate.

### BT-06 — EDGE BUILD

Purpose: support limited-connectivity or offline operation.

Scope:
- local inference adapter where supported;
- local context and approved memory;
- offline workflow execution;
- queued synchronization;
- conflict handling and recovery.

Acceptance criteria:
- offline capabilities and unavailable cloud dependencies are explicit;
- local data is protected;
- queued actions are re-authorized before privileged synchronization;
- synchronization is idempotent and conflict-aware;
- edge operation cannot silently bypass central policy.

This type is a later extension, not a prerequisite for the first flagship integration candidate.

## 3. Recognized build profiles

A profile describes the purpose and controls of a particular build or deployment.

- DEVELOPMENT — rapid engineering, local diagnostics and developer test data.
- PROTOTYPE — isolated experiments; no production credentials or production data.
- INTEGRATION — compatibility testing across pinned component versions and contracts.
- PRODUCTION — controlled release with approved configuration, monitoring, rollback and change records.
- ENTERPRISE — managed organizational configuration with tenant and administrative controls.
- RECOVERY — restoration, backup verification and continuity exercises.

A profile does not grant permissions. WARP GATE and the deployment environment remain authoritative.

## 4. Flagship composition and delivery order

The recommended flagship target is a governed hybrid platform composed initially of BT-01 CORE, BT-02 MODULAR, BT-03 AGENTIC and BT-04 HYBRID.

BT-05 ENTERPRISE and BT-06 EDGE are subsequent extensions, introduced only when their acceptance criteria and operational requirements are funded and validated.

Recommended delivery sequence:
1. M0 — repository baseline, working-tree inspection and verified recovery artifacts;
2. M1 — WARP GATE authorization boundary and adapter contract;
3. M2 — CLC lifecycle integration;
4. M3 — Inspector read-only runtime and evidence reports;
5. M4 — CRAFT integration and deterministic tests;
6. M5 — COSMAXX and SHAPE interfaces;
7. M6 — Core orchestration and versioned module contracts;
8. M7 — authentication, identity and tenant-safe persistence;
9. M8 — agent registry and capability-scoped task orchestration;
10. M9 — Termux and workstation hybrid adapters;
11. M10 — integrated functional, security, regression and recovery testing;
12. M11 — release-candidate review and certification evidence.

Milestones are gated. A later milestone must not be reported complete merely because its specification exists.

## 5. Seven-domain alignment

Every build type must declare how it affects the seven COSMOS domains:

- THINK — reasoning, planning and decision support;
- KNOW — memory, retrieval, knowledge and evidence;
- ACT — tools, workflows and execution adapters;
- GOVERN — policy, authorization, approval and audit;
- ADAPT — feedback, optimization and controlled adjustment;
- COMPANION — user interaction, continuity and user-facing controls;
- EVOLVE — evaluation, learning loops and versioned improvement.

Not every module implements all seven domains. Each module must identify its domain responsibilities and dependencies. GOVERN is a cross-cutting constraint, not an optional feature.

## 6. Mandatory build manifest

Every implementation milestone must publish a build manifest containing:

- build type(s) and build profile;
- objective and scope boundaries;
- repository, branch and starting commit SHA;
- module owner and version;
- API/interface contracts;
- dependencies and configuration requirements;
- data classification and secret handling;
- WARP GATE capability requirements;
- tests, commands and actual results;
- evidence references and confidence;
- known gaps and rollback instructions;
- acceptance decision and approver.

## 7. Universal engineering and governance requirements

1. Preserve independent repository histories; do not merge repositories wholesale.
2. Inspect before modifying and verify restore points before writes.
3. Use isolated branches and reviewed, versioned interfaces.
4. Keep planning, authorization and execution separate.
5. Default to deny for privileged capabilities.
6. Apply least privilege, revocation, expiry and audit.
7. Treat retrieved content and agent output as untrusted data.
8. Require explicit approval for production deployment, destructive changes and irreversible operations.
9. Run unit, integration, security, regression and recovery tests appropriate to the change.
10. Never claim implementation, test success, certification or deployment without direct evidence.

## 8. Repository boundaries

- `cosmos-alien-mind` is the flagship application and integration host.
- `cosmos-cyber-sec-ops` remains the independent security and governance foundation.
- Cross-repository integration is through reviewed specifications, versioned interfaces and adapters.
- This standard does not authorize wholesale merge, branch deletion, force-push, production migration or deployment.

## 9. Current implementation status

The Termux screenshot previously supplied by the operator showed Android 15 / ARM64, Node.js v24.22.3, npm 12.2.3, Python 3.14.10, Git 2.56.1, a successful read-only runtime probe and one passing test. It did not prove authenticated heartbeat, remote dispatch, GPT connectivity or full platform integration.

The remote M0 baseline record is partial. The remote checkpoint branch does not capture uncommitted or untracked local files. Local working-tree verification and a verified local Git bundle remain outstanding.

Therefore this document is an architecture standard, not a completion certificate.

## 10. Definition of done for the flagship

The flagship integration candidate is ready for release review only when:
- the two source repositories remain independently recoverable;
- the initial BT-01 through BT-04 scope is implemented through reviewed interfaces;
- WARP GATE authorization is enforced for privileged operations;
- CLC lifecycle transitions and audit history are tested;
- Inspector reports are reproducible and read-only by default;
- CRAFT results are deterministic and tested;
- COSMAXX and SHAPE recommendations have measurable acceptance criteria;
- identity, authentication and tenant boundaries are verified;
- Termux and workstation adapters have authenticated, constrained behavior;
- integrated security, regression and recovery tests pass;
- a release and rollback package is reviewed and approved.

---
End of standard.
