export type CraftEvidenceStatus = "VERIFIED"|"OBSERVED"|"INFERRED"|"UNVERIFIED"|"CONFLICTED"|"STALE";
export interface CraftBlocker {id:string;title:string;description?:string;impact:number;likelihood:number;urgency?:number;evidenceConfidence?:number;evidenceStatus?:CraftEvidenceStatus;}
export function triageCraft(input:{blockers:CraftBlocker[]}):{
 schema:"cosmos.craft-triage.v1";
 engine:{name:string;version:string;mode:string};
 generatedAt:string;
 recommendationOnly:true;
 executionAuthorized:false;
 priorityOrder:string[];
 summary:{total:number;critical:number;high:number;needsEvidenceReview:number};
 blockers:Array<Record<string,unknown>>;
 governance:{authority:"WARP GATE";defaultDecision:"deny";humanApprovalRequired:true};
 limitations:string[];
};
