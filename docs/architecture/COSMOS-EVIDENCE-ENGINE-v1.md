# COSMOS EVIDENCE ENGINE v1.0

Status: Initial implementation candidate on isolated branch `cosmos/evidence-engine-v1`.

## Purpose
Provide a shared deterministic evidence-assessment service for Inspector, CRAFT, COSMAXX, SHAPE, Build Guidance and WARP GATE integrations. It distinguishes verified, observed, inferred, unverified, conflicted and stale findings.

## Lifecycle
1. Collect structured source observations.
2. Validate required metadata and artifact integrity.
3. Record provenance and source tier.
4. Assess evidence quality using deterministic heuristic dimensions.
5. Reconcile records sharing a subject and claim key; different values are marked conflicted.
6. Produce a report with counts, findings, conflicts and limitations.
7. Pass reports to an approved persistence adapter; persistence is not implemented by this milestone.

## Verification semantics
A finding is VERIFIED only when it has complete required metadata, an authoritative source tier, a supplied artifact and a matching SHA-256 digest. A matching digest establishes artifact consistency, not truth of the artifact's claims. Other records remain OBSERVED, INFERRED, UNVERIFIED or STALE as applicable. Conflicting values are marked CONFLICTED.

Confidence is a deterministic quality heuristic based on metadata completeness, source tier, artifact integrity and freshness. It is not a probability of truth and must not be used alone for authorization.

## API
`POST /api/evidence` accepts 1–500 records. Artifact payloads are limited to 100,000 characters per record. The route is stateless and returns an assessment report with Cache-Control no-store.

## Storage boundary
No database writes or persistent storage are performed. The module exports a storage-adapter contract requiring append-only corrections, access control, encryption at rest, retention controls, audit trail and tenant isolation. A production adapter needs a separate schema, threat review and migration plan.

## Governance
The engine cannot authorize actions. WARP GATE remains the policy authority and defaults to deny. Evidence status does not grant permissions. Untrusted source content must be treated as data, never instructions.

## Tests
`node --test tests/evidence-engine.test.mjs`

Coverage: valid digest, digest mismatch, source-tier rules, stale records, conflict detection, inference status, invalid input, no-execution-authority invariant and storage contract.

## Limitations and release gates
- No persistent store or authentication/rate limiting is included.
- Source tier is supplied by caller and must be bound to a trusted connector identity before production use.
- SHA-256 is an integrity check, not a signature or truth guarantee.
- Confidence weights are heuristic and require calibration against labeled examples.
- Production integration requires threat modeling, trusted-source identity, persistence controls, privacy/retention review and independent validation.
- No production deployment or database migration is authorized by this implementation.
