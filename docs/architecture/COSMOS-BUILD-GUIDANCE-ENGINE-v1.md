# COSMOS BUILD GUIDANCE ENGINE v1.0
Status: Initial implementation candidate on an isolated feature branch.
Governing standard: `docs/architecture/COSMOS-BUILD-TYPES-STANDARD-v1.md`.

## Purpose
Convert a natural-language build objective into a deterministic recommendation. The engine classifies build types and profiles, maps seven domains, recommends modules and canonical milestones, identifies governance controls and risks, and produces a manifest template.

It is advisory. It does not execute commands, create branches, modify repositories, grant permissions, deploy software or approve releases.

## Inputs
- Objective: 12–4,000 characters.
- Optional type overrides: BT-01 through BT-06.
- Optional profile: DEVELOPMENT, PROTOTYPE, INTEGRATION, PRODUCTION, ENTERPRISE or RECOVERY.
- Optional repository label.

Without explicit types, classification uses keyword matching against the canonical catalog. If no type keywords match, CORE and MODULAR are the fallback. Profile inference is deterministic and defaults to DEVELOPMENT.

## Outputs
Schema and engine version; selected types and profile; candidate ranking and heuristic confidence; seven-domain alignment; module and milestone recommendations; WARP GATE requirements; risk flags; manifest template; acceptance gates.

Confidence is a heuristic classification indicator, not a probability of delivery success.

## API
`POST /api/build-guidance`
Example:
```json
{"objective":"Integrate Android Termux with the COSMOS cloud bridge and Neon device registry","repository":"CodebruteDamage/cosmos-alien-mind"}
```
The route validates and returns a stateless recommendation. It does not persist objectives.

## Governance
WARP GATE remains authoritative. Capability labels are not grants or credentials. Privileged operations default to deny. Production and destructive changes require human approval, while runtime restrictions remain binding. Retrieved content and agent output are untrusted. No arbitrary shell execution or remote task dispatch is introduced.

## Tests
`node --test tests/build-guidance.test.mjs`
Tests cover classification, profile inference, mandatory GOVERN alignment, risk flags, explicit overrides, invalid input and the no-execution-authority invariant.

## Limitations
- Classification uses deterministic keyword matching, not semantic inference.
- Confidence is heuristic.
- Repository branch, commit, dependencies and restore point require a separate inspection step.
- Module recommendations do not prove the modules exist.
- API authentication and rate limiting are not added here; do not expose as a sensitive production workflow without approved abuse controls.

## Acceptance
Not certified until tests, lint, type-check and production build run against this branch. Deployment and runtime integration require separate approval and verification.
