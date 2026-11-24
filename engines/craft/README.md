# COSMOS CRAFT Engine v1.0

CRAFT is a deterministic, recommendation-only blocker assessment module. It scores evidence-supplied blocker metadata and proposes the next review step. It does not execute remediation.

## Runtime

Node.js 20 or newer. No third-party dependencies.

## Input contract

Each blocker requires an ID, summary, and four evidence-backed scores from 0 to 5: complexity, risk, urgency, and dependency impact. Confidence is 0 to 5. Evidence references must be supplied by the caller; CRAFT never invents evidence or scores.

Weights: risk 35%, urgency 25%, complexity 20%, dependency impact 20%. Priority bands: critical >= 4, high >= 3, moderate >= 2, otherwise low. Confidence below 3 or missing evidence references requires evidence collection before remediation planning.

## 12 GAP Cycle boundary

Optional cycle and stage references are preserved as metadata only. CRAFT does not define or infer the twelve stages.

## Governance

- Recommendation-only; no shell, network, file, package, or repository operations.
- No autonomous remediation or permission escalation.
- Every assessment requires human approval.
- Low-confidence or unreferenced assessments explicitly request evidence.
- Callers remain responsible for authentication, authorization, audit persistence, and source provenance.
- Scores are triage aids, not proof of root cause or safety.

## Test

`node --test engines/craft/tests/*.test.mjs`
