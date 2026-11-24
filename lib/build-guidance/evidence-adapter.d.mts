import type { EvidenceAssessmentReport } from "../evidence-engine/engine.mjs";
export type { EvidenceAssessmentReport } from "../evidence-engine/engine.mjs";
export function attachEvidenceAssessment(
 guidance: Record<string, unknown>,
 report: EvidenceAssessmentReport
): Record<string, unknown>;
