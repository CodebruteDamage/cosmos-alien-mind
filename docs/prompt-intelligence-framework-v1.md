# COSMOS Prompt Intelligence Framework v1.0

## Purpose

Provide a modular registry for the 16 prompt capabilities shown in the Claude prompt reference. The framework recommends a capability from a user prompt and exposes its workflow and execution policy. This initial integration is a recommendation layer, not an autonomous execution engine.

## Command registry

| Command | Domain | Purpose |
|---|---|---|
| /deep-research | KNOW | Multi-source research and structured evidence |
| /analysis | THINK | Analysis, findings, risks, and gaps |
| /plan | PLAN | Strategy, milestones, and dependencies |
| /create | CREATE | Reports, templates, specifications, and content |
| /code | ENGINEERING | Code authoring, debugging, and improvement |
| /think | THINK | Options, assumptions, and trade-offs |
| /write | CREATE | Clear, audience-aware writing |
| /research | KNOW | Current topic research and summaries |
| /audience | INTELLIGENCE | Audience understanding and messaging |
| /document | KNOW | Document extraction and synthesis |
| /compare | INTELLIGENCE | Evidence-based option comparison |
| /improve | OPTIMIZATION | Bounded refinement of existing work |
| /automate | AUTONOMY | Repeatable workflow design |
| /build | ENGINEERING | Application and system implementation |
| /optimize | OPTIMIZATION | Measured performance and efficiency work |
| /action-plan | PLAN | Sequenced actions, owners, and timelines |

## Lifecycle

1. **INTAKE** — accept a prompt and validate its shape.
2. **DISCOVER** — identify an explicit command or recommend one from deterministic keyword matches.
3. **ANALYZE** — expose the command's workflow and alternatives; ambiguous prompts require clarification.
4. **EVIDENCE** — gather source material and record confidence before any consequential action.
5. **GOVERN** — check authorization, scope, permissions, data boundaries, and approval requirements.
6. **PROVISION** — prepare changes in an isolated branch and preserve a known baseline.
7. **EXECUTE** — invoke only approved capabilities through authorized adapters. Not implemented by this release.
8. **VERIFY** — run tests and validate acceptance criteria. Not performed by the recommendation API.
9. **REVIEW** — present evidence, diffs, risks, and unresolved gaps for human review.
10. **RELEASE** — merge or deploy only after required approvals and successful checks.

## API

- `GET /api/commands` returns the command catalog.
- `POST /api/commands` accepts `{ "prompt": "..." }` and returns a deterministic recommendation, alternatives, and policy metadata.

The API does not execute commands, call model providers, access tools, modify repositories, or bypass authorization. Explicit unknown slash commands return HTTP 400. Ambiguous prompts return `needs_clarification`.

## Governance boundaries

- A recommendation is not an execution grant.
- `read_only`, `draft_only`, and `approval_required` describe capability risk boundaries; actual runtime permissions must be enforced by WARP GATE.
- Any write, external action, deployment, destructive operation, or change to protected data requires authorization and applicable human approval.
- Evidence and confidence must be recorded independently of the recommendation score.
- Provider credentials remain server-side and must never be committed.
- Do not treat this registry as a substitute for authentication, authorization, rate limiting, audit logging, or per-user data isolation.

## Integration status

- Registry and deterministic recommendation API: implemented in this branch.
- Live model inference and natural-language semantic routing: not implemented.
- WARP GATE runtime enforcement: not connected in this repository.
- Evidence Engine, CRAFT, and Policy Engine adapters: not connected.
- Authentication and per-user isolation: not implemented in the existing MVP.
- Build, lint, and runtime tests: must pass before merge.
- Production deployment: not authorized by this framework and not performed by this change.
