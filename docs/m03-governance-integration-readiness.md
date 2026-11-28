# M03 — Governance Integration & Activation Readiness

## Status

Implementation package on `cosmos/m03-governance-readiness-v1`. This is a draft, non-production milestone. It does not activate execution, create credentials, provision infrastructure, merge pull requests, or deploy.

## Pre-scan evidence

- PR #11 (COSMAXX runtime adapter), PR #15 (WARP GATE workflow adapter), PR #17 (COSMAXX hardening), and PR #18 (automatic task ownership) are separate open draft pull requests.
- PR #17 and PR #18 have successful GitHub Actions runs for tests, TypeScript, ESLint, and production build.
- PR #15's adapter is a host integration contract. It requires real identity, signing, verification, approval, replay protection, and durable audit implementations from the host.
- The PR #15 grant binding contains workflow ID, step ID, capability, action, and risk. It does not bind actor, tenant, scope, parameter digest, or policy version.
- The current default-branch README states that authentication, per-user isolation, and production abuse controls are not implemented.
- The ownership policy references 12 GAP CYCLE, but the inspected PR #18 tree does not contain a 12 GAP lifecycle implementation.
- Provider candidates are caller-supplied; no trusted provider registry or durable task queue is implemented by PR #18.

## M03 implementation

The accompanying `warp-gate-contract.ts` adds a strict authorization boundary contract that requires:
- actor and tenant identity;
- workflow and step identity;
- capability, action, risk, and explicit scope;
- SHA-256 parameter digest and policy version;
- expiry, issuance time, grant ID, and nonce;
- approval reference when human approval is required;
- host verification and atomic nonce consumption before returning ALLOW;
- fail-closed handling of DENY, REQUIRE_APPROVAL, BLOCKED, malformed responses, timeouts, mismatches, expiry, and verifier failures.

The helper does not implement cryptographic signature verification, identity resolution, policy evaluation, approval storage, or replay protection itself. The host's `verifyAndConsume` implementation must perform those operations atomically and return verified claims only after successful verification and consumption. A timed-out host operation may continue unless the host honors AbortSignal; the host must reconcile uncertain consumption outcomes and must never dispatch work after a timeout.

## 12 GAP acceptance gates

| Gate | Required evidence | Current status |
|---|---|---|
| G1 Intake | Task ID, actor, tenant, scope, acceptance criteria | Partial |
| G2 Discovery | Canonical repository and provider identity evidence | Partial |
| G3 Evidence | Source refs, hashes, provenance, freshness | Partial |
| G4 Analysis | Risk and impact assessment | Defined, not integrated |
| G5 Ownership | Specialist owner, ORCH, TPO, execution provider | Policy exists on PR #18 |
| G6 Authorization | Exact WARP GATE binding and grant verification | Contract added; host pending |
| G7 Approval | Explicit approval reference for consequential work | Contract requirement added; host pending |
| G8 Execution | Authorized executor and bounded capabilities | Not verified |
| G9 Verification | Independent postcondition checks | Partial in workflow runtime contract |
| G10 Recovery | Timeout, cancellation, retry, reconciliation | Partial; host behavior pending |
| G11 Audit | Durable append-only audit evidence | Not implemented |
| G12 Closure | Acceptance criteria and evidence-backed final status | Not implemented |

No gate is marked fully passed for production. The table is an acceptance checklist, not a claim that a 12 GAP engine is deployed.

## Required next integrations

1. Reconcile PR #15 and PR #18 onto a reviewed integration base without changing `main`.
2. Supply trusted actor and tenant identity from the authenticated host, never from model-generated input.
3. Implement signature/issuer verification and atomic replay-safe nonce consumption.
4. Bind canonical parameter serialization to the parameter digest.
5. Persist approval records and immutable authorization/audit events.
6. Add a trusted provider registry with capability attestations and revocation.
7. Add the 12 GAP lifecycle implementation and negative-path tests.
8. Add authentication, per-user data isolation, rate limiting, and abuse controls before production exposure.
9. Run full CI and independent security review before requesting human merge approval.

## Non-goals and safety boundary

This milestone is a policy contract and evidence package. It is not a production authorization service. No ALLOW may be inferred from a successful unit test. Missing integration, missing evidence, malformed responses, timeouts, and unverified identity must block execution. Human approval does not override a WARP GATE denial or runtime restriction.
