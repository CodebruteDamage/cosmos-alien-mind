export interface EvidenceAssessmentReport {
 schema: "cosmos.evidence-report.v1";
 recordCount: number;
 counts: Record<string, number>;
 conflictCount: number;
 overallConfidence: number;
 findings: Array<{ evidenceId?: string } & Record<string, unknown>>;
 limitations: string[];
}
export function attachEvidenceAssessment(
 guidance: Record<string, unknown>,
 report: EvidenceAssessmentReport
): Record<string, unknown>;
