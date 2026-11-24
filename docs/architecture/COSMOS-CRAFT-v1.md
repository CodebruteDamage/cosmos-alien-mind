# COSMOS CRAFT v1.0
Status: implementation candidate on `cosmos/evidence-engine-v1`.

## Purpose
CRAFT means Complexity, Risk & Adaptive Fix Triage. It ranks declared blockers using caller-supplied impact, likelihood, urgency and evidence confidence. It is deterministic and advisory.

## Scoring
Score = impact × 0.35 + likelihood × 0.25 + urgency × 0.20 + (1 − evidenceConfidence) × 5 × 0.20. Each risk dimension is on a 1–5 scale; evidence confidence is 0–1. Priority bands: P0 >= 4.1, P1 >= 3.3, P2 >= 2.4, otherwise P3. Ties sort by blocker ID.

## Evidence integration
`POST /api/craft` returns the CRAFT triage and submits a serialized report to the stateless Evidence Engine. The resulting finding is explicitly INFERRED; it is not promoted to VERIFIED because CRAFT output is an engine-generated assessment, not independently authoritative source evidence.

## Governance
CRAFT cannot execute fixes, modify repositories, grant permissions or approve releases. WARP GATE remains authoritative and defaults to deny. Human approval remains required for privileged actions.

## Limitations
Inputs are caller-supplied and must be independently substantiated. Scores are prioritization heuristics, not probabilities. The Evidence Engine remains stateless; no persistent evidence storage is added.
