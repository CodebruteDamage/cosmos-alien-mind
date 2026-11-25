# COSMOS Dual-Brain Integration v1.0

**Status:** Contract and lifecycle baseline only — not operational runtime integration  
**Human owner:** Franz — strategic direction and release approval  
**Repository:** `CodebruteDamage/cosmos-alien-mind`  
**Branch:** `integration/dual-brain-lifecycle-v1`

## 1. Objective

Integrate COSMOS Core and Alien Mind as two collaborating logical intelligence roles inside one COSMOS system. Preserve one management hierarchy, one governed execution path, and independent authorization. Reuse existing components; do not introduce another orchestration engine or duplicate memory store.

This document defines the integration boundary and acceptance lifecycle. It does not claim that either brain is connected to a live model provider.

## 2. Repository baseline observed before changes

The default branch currently contains a Next.js 15 / React 19 dashboard MVP, a Neon server-side database client, a database health route, and conversation persistence routes.

The current dashboard states that live AI/model inference is not implemented. The README also states that authentication, per-user data isolation, and production abuse controls are not implemented. The conversation POST route stores a user message; it does not call an AI provider or produce an assistant response.

A separate Alien Mind reasoning runtime was not found in the inspected repository tree. This is a repository-scope finding; a separate repository, local workspace, or uninspected branch may still contain it. See `docs/audits/alien-mind-brain-reaudit-v1.md`.

Consequently, live dual-brain operation is blocked until the actual Alien Mind source is located and audited, provider integration exists, and security prerequisites are implemented and verified. The existing unauthenticated conversation endpoint must not be used as a production dual-brain execution boundary.

## 3. Logical responsibilities

| Component | Responsibility | Must not do |
|---|---|---|
| COSMOS | Complete governed system and product identity | Be confused with either individual reasoning role |
| COSMOS Core | Primary request interpretation, task coordination, final synthesis and response ownership | Bypass policy or independently grant tool permissions |
| Alien Mind | Independent analysis, alternative reasoning, critique and evidence-gap identification | Become a second system authority or execute tools directly |
| Dual-Brain Coordinator | Correlate one request across both roles, apply timeouts, collect results and record disagreements | Become a new general-purpose orchestration layer |
| Neural Link | Supply approved, provenance-bearing shared context when available | Treat untrusted retrieved content as instructions |
| WARP GATE | Independently authorize every protected tool/action through a verified enforcement boundary | Delegate its authority to either brain |
| Inspector | Independently validate integration behavior, evidence and test outcomes | Modify production code or approve its own findings |
| Runtime Supervisor | Observe availability, latency, errors, resource use and recovery | Grant permissions |
| Human owner: Franz | Set strategic direction and approve release promotion | Be represented as a model, runtime process, credential, or bypass authority |

The coordinator is a narrow adapter/workflow inside the existing runtime, not a new manager or standalone engine. “Alien Mind” names the second analytical role; it is not a separate governance hierarchy or synonym for the entire COSMOS system.

## 4. Request lifecycle

1. **Receive:** Accept a request only through an authenticated application boundary.
2. **Scope:** Create a request ID, user/tenant scope, policy context and data classification.
3. **Context:** Retrieve only context the authenticated principal is permitted to access. Preserve source/provenance metadata.
4. **Primary pass:** COSMOS Core produces a structured analysis and identifies uncertainties.
5. **Independent pass:** Alien Mind receives the minimum authorized request/context and returns a separate structured analysis. It does not receive credentials or unrestricted tool access.
6. **Reconcile:** The coordinator compares conclusions, records agreement/disagreement and preserves unresolved uncertainty. It must not silently discard a material disagreement.
7. **Authorize:** Any proposed external action is submitted to WARP GATE. No brain or coordinator may self-authorize.
8. **Execute:** Only the existing approved runtime executes an authorized action.
9. **Verify:** Record outcome and evidence. Inspector validates representative traces and negative authorization cases.
10. **Respond:** COSMOS Core produces the user-facing synthesis, including material uncertainty and action status.
11. **Monitor:** Runtime Supervisor reports health and measured gaps to the Global Supervisor.

## 5. Required contracts

Each brain adapter must implement the same narrow request/response envelope.

### Request fields

- `request_id`: unique correlation identifier
- `role`: `cosmos_core` or `alien_mind`
- `tenant_id`: authenticated tenant scope; never inferred from model output
- `user_id`: authenticated principal identifier
- `input`: bounded task content
- `context`: authorized context items with provenance
- `policy_version`: policy snapshot used for the request
- `deadline_ms`: bounded execution deadline

### Response fields

- `request_id`: must match the request
- `role`: responding brain role
- `status`: `ok`, `refused`, `timeout`, or `error`
- `summary`: concise analysis
- `claims`: claims with supporting evidence references where available
- `uncertainties`: explicit unknowns and assumptions
- `proposed_actions`: suggestions only; never executable grants
- `duration_ms`: measured duration
- `provider_id`: non-secret provider/model identifier

Do not place API keys, access tokens, database connection strings, or other secrets in either envelope or persisted logs.

## 6. Failure and disagreement rules

- If one brain times out or fails, mark it unavailable and follow an explicit single-brain fallback policy; never label the result as dual-brain consensus.
- If both brains disagree on a material claim, preserve both positions and escalate or ask for evidence. Do not resolve disagreement by arbitrary majority.
- If request IDs, tenant scopes, policy versions or response roles do not match, reject the response.
- If authorization is unavailable, denied, or unverifiable, do not execute the proposed action.
- If shared context provenance is missing, treat the content as unverified and do not use it to authorize actions.
- Bound retries and execution time to prevent runaway cost or loops.

## 7. Security prerequisites before live inference

These are release blockers, not optional enhancements:

1. Authenticate users and establish server-verified user/tenant identity.
2. Enforce per-user and per-tenant authorization on conversation reads and writes.
3. Keep provider credentials server-side and out of client bundles, prompts, logs and responses.
4. Add request size, rate, concurrency and timeout limits.
5. Establish a verified WARP GATE service/adapter boundary for protected actions; fail closed when unavailable.
6. Define retention, deletion and audit-log access rules for prompts, context and model responses.
7. Test cross-tenant access denial and prompt-injection/untrusted-context boundaries.

## 8. Implementation lifecycle and acceptance gates

| Gate | Work | Acceptance evidence |
|---|---|---|
| DB-01 Discovery baseline | Locate and inventory both brain implementations, runtime, providers, Neural Link, WARP GATE and Inspector | Verified file/branch inventory with paths and owners |
| DB-02 Contract | Adopt shared request/response schemas and role boundaries | Schema validation tests; mismatched role/request rejection |
| DB-03 Security boundary | Implement authentication, tenant isolation and secret handling | Positive and negative authorization tests; no cross-tenant reads |
| DB-04 Provider adapters | Connect each brain through server-only provider adapters | Independent provider smoke tests; secrets absent from logs |
| DB-05 Coordinator | Add bounded parallel/serial invocation, correlation, timeout and disagreement handling | Deterministic unit/integration tests for success, timeout, failure and disagreement |
| DB-06 Governed tools | Route all protected actions through WARP GATE and existing runtime | Allowed and denied action tests; no bypass path |
| DB-07 Observability | Emit structured traces and health metrics for supervisors | Correlated traces with redacted data and measurable latency/error fields |
| DB-08 Independent validation | Inspector validates behavior and evidence | Repeatable test report; all critical findings closed |
| DB-09 Controlled rollout | Human approval for staging, then production promotion | Staging evidence, rollback plan and explicit human certification |

A gate cannot be marked passed based on documentation alone. Each pass requires executable evidence from the target environment.

## 9. Non-goals and simplicity constraints

- No new management hierarchy or global orchestrator.
- No separate memory system solely for the second brain.
- No direct tool execution by either model.
- No automatic deployment or production promotion.
- No automatic creation of COSMAXX or other optimization engines.
- No broad refactor of the existing dashboard or conversation storage.
- No claim of production readiness until security and runtime gates pass.

## 10. Current status

- Repository target confirmed: `cosmos-alien-mind`.
- Feature branch created from `main`.
- Existing MVP inspected; no application source files were changed.
- Dual-brain contract and lifecycle baseline recorded in this file.
- Alien Mind re-audit recorded separately; the actual Alien Mind implementation remains unlocated in this repository.
- Live model inference, authenticated tenant isolation, provider adapters, WARP GATE production integration and end-to-end tests remain unimplemented/unverified.
- No deployment, merge or production configuration changes were performed.

**Next milestone:** locate the actual Alien Mind implementation and complete DB-01 before writing adapters or schemas. Then implement DB-02 and DB-03 with executable tests. Do not wire live dual-brain calls ahead of the security boundary.
