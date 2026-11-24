export type EvidenceStatus = "VERIFIED"|"OBSERVED"|"INFERRED"|"UNVERIFIED"|"CONFLICTED"|"STALE";
export interface EvidenceInput {evidenceId?:string;source:string;sourceTier?:"authoritative"|"first_party"|"secondary"|"unknown";subject:string;claim:string;claimKey?:string;value?:unknown;kind?:"observation"|"inference";collectedAt:string;artifact?:string;digest?:string;sourceReference?:string;}
export interface EvidenceAssessmentReport {
 schema:"cosmos.evidence-report.v1";
 engine:{name:string;version:string;mode:string};
 evaluatedAt:string;
 recordCount:number;
 counts:Record<string,number>;
 conflictCount:number;
 overallConfidence:number;
 findings:Array<{evidenceId?:string|null;status:EvidenceStatus;[key:string]:unknown}>;
 conflicts:Array<Record<string,unknown>>;
 limitations:string[];
 authorization:{executionAuthorized:false;policyAuthority:"WARP GATE";defaultDecision:"deny"};
}
export function evaluateEvidence(input:{records:EvidenceInput[]},options?:{now?:string|Date;maxAgeDays?:number}):EvidenceAssessmentReport;
export function createEvidenceStoreAdapterContract():Readonly<Record<string,unknown>>;
export const EVIDENCE_STATUSES:readonly EvidenceStatus[];
export const SOURCE_TIERS:readonly string[];
