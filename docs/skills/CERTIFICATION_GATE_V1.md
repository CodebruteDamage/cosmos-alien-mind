# COSMOS Skill Certification Gate v1.0

Status: proposed control specification. This document does not certify or activate any skill.

## Purpose
Provide a fail-closed admission and certification process for skills. Certification applies to an exact artifact digest and exact source revision. Any change to source files, dependencies, runtime adapter, or declared capabilities invalidates the prior decision pending reassessment.

## Certification levels
- L0 Submitted: candidate recorded; proposed only.
- L1 Source verified: upstream repository, pinned revision, complete file inventory, and license evidence recorded.
- L2 Static verified: per-file SHA-256, artifact digest, manifest validation, dependency inventory, and static security review passed.
- L3 Sandbox verified: disposable isolation tests passed with synthetic data, no production credentials, and explicit network/filesystem/process restrictions.
- L4 Governed certified: WARP GATE server-side enforcement tests, audit verification, independent review, and exact-digest approval passed.

Certification level is not an execution grant. L4 means eligible for a separate activation decision only.

## Mandatory gates
- G0 Source identity: immutable repository URL, commit, complete relevant file inventory.
- G1 License: SPDX identifier, exact license evidence, attribution/notice obligations, legal review disposition.
- G2 Integrity: SHA-256 for every admitted file and a deterministic package digest.
- G3 Manifest: schema-valid manifest; least-privilege capabilities and explicit scope.
- G4 Static security: scripts, helper files, dependency tree, network destinations, filesystem writes, subprocesses, secrets handling, and prompt-injection boundaries reviewed.
- G5 Sandbox: disposable environment, synthetic fixtures, no production credentials, restricted network, read-only source mount where possible, resource limits, and cleanup evidence.
- G6 WARP GATE: server-side authorization on every privileged operation; deny-by-default; capability, scope, risk, approval, and session validation; immutable audit events. UI or registry metadata must never grant authority.
- G7 Independent review: reviewer other than the author/operator approves the exact artifact digest and evidence set.
- G8 Activation: separate explicit approval, scoped capability grant, rollback plan, expiry, and revocation path. Activation is never automatic.

## Fail-closed rules
Any failed, missing, stale, or unverifiable mandatory gate blocks progression. 'Not applicable' requires a written rationale and independent reviewer approval. A source or dependency change resets affected gates and invalidates L4 status. The skill itself cannot approve, certify, or enable itself.

## Required record
Use schemas/skill-certification.v1.schema.json. Store the record with evidence references, exact artifact digest, reviewer, review timestamp, and review/expiry date. Do not store secrets in certification records.

## Pilot order
1. systematic-debugging: first reference candidate; no shell execution. Review referenced files and dependencies before sandboxing.
2. webapp-testing: second; high-risk test automation. Only synthetic target applications and synthetic accounts in an isolated environment.
3. skill-creator: third; generated output always enters quarantine and cannot approve or enable itself.

## Current disposition
All pilot candidates remain proposed, uninstalled, and execution-disabled. Source/license location review is not equivalent to complete package verification, sandbox validation, WARP GATE enforcement, or certification.
