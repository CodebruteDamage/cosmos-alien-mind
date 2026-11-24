# CRAFT Engine v1.0

**Complexity, Risk & Adaptive Fix Triage**

CRAFT is a deterministic, recommendation-only blocker assessment module for COSMOS. It scores supplied blocker metadata, identifies evidence gaps, and proposes the next review step. It does not execute remediation.

## Runtime

Node.js 20 or newer. No third-party dependencies.

~~~js
import { assessBlocker } from "./index.mjs";

const result = assessBlocker({
  id: "BLOCK-001",
  summary: "Integration test is blocked by missing provider configuration",
  complexity: 2,
  risk: 3,
  urgency: 4,
  dependency: 3,
  confidence: 2,
  gapCycleId: "optional-cycle-reference",
  gapStageId: "optional-stage-reference",
  source: "integration-test"
});
console.log(result);
~~~

Run tests from the repository root:

~~~bash
node --test engines/craft/tests/*.test.mjs
~~~

## Scoring model

Each dimension is a required number from 0 to 5:

- Risk: 35%
- Urgency: 25%
- Complexity: 20%
- Dependency impact: 20%

Priority bands: critical >= 4, high >= 3, moderate >= 2, otherwise low. Confidence is independently scored from 0 to 5; confidence below 3 requires evidence collection before remediation planning.

## 12 GAP Cycle integration boundary

CRAFT accepts optional gapCycleId and gapStageId references so a caller can associate a blocker with an existing 12 GAP Cycle record. CRAFT does not define, rename, reorder, or infer the twelve stages. The canonical 12 GAP Cycle contract must be supplied by its owning module before deeper integration.

## Governance

- Recommendation-only; no shell, network, file, package, or repository operations.
- No autonomous remediation or permission escalation.
- Every result sets requiresHumanApproval to true.
- Low-confidence assessments explicitly request evidence.
- Callers remain responsible for authentication, authorization, audit persistence, and input provenance.
- Scores are triage aids, not proof of root cause or safety.
