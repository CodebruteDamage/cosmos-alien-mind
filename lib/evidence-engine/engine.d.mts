export type EvidenceStatus = "VERIFIED"|"OBSERVED"|"INFERRED"|"UNVERIFIED"|"CONFLICTED"|"STALE";
export interface EvidenceInput {evidenceId?:string;source:string;sourceTier?:"authoritative"|"first_party"|"secondary"|"unknown";subject:string;claim:string;claimKey?:string;value?:unknown;kind?:"observation"|"inference";collectedAt:string;artifact?:string;digest?:string;sourceReference?:string;}
export function evaluateEvidence(input:{records:EvidenceInput[]},options?:{now?:string|Date;maxAgeDays?:number}):Record<string,unknown>;
export function createEvidenceStoreAdapterContract():Readonly<Record<string,unknown>>;
export const EVIDENCE_STATUSES:readonly EvidenceStatus[];
export const SOURCE_TIERS:readonly string[];
