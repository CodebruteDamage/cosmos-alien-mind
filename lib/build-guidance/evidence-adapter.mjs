/**
 * Shared Evidence Engine adapter for COSMOS Build Guidance.
 * Evidence affects recommendation transparency only; never grants execution.
 */
export function attachEvidenceAssessment(guidance, report) {
 if(!guidance || guidance.recommendationOnly!==true) throw new TypeError("valid guidance recommendation required");
 if(!report || report.schema!=="cosmos.evidence-report.v1" || !Array.isArray(report.findings)) throw new TypeError("valid evidence report required");
 const counts=report.counts||{};
 const hasBlockingEvidence=(counts.CONFLICTED||0)>0 || (counts.UNVERIFIED||0)>0 || (counts.STALE||0)>0;
 return {
  ...guidance,
  evidenceAssessment:{
   schema:report.schema,
   recordCount:report.recordCount,
   counts,
   conflictCount:report.conflictCount,
   overallConfidence:report.overallConfidence,
   recommendationStatus:hasBlockingEvidence?"EVIDENCE_REVIEW_REQUIRED":"EVIDENCE_ASSESSED",
   evidenceIds:report.findings.map(item=>item.evidenceId).filter(Boolean),
   limitations:report.limitations
  },
  executionAuthorized:false
 };
}
