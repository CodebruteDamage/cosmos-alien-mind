/**
 * COSMOS CRAFT v1.0 — deterministic blocker triage.
 * Complexity, Risk & Adaptive Fix Triage. Advisory only; never executes or authorizes work.
 */
const SEVERITIES=Object.freeze(["critical","high","medium","low"]);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function scoreBlocker(item){
 const impact=clamp(item.impact,1,5),likelihood=clamp(item.likelihood,1,5),urgency=clamp(item.urgency??3,1,5);
 const confidence=clamp(item.evidenceConfidence??0,0,1);
 const uncertainty=1-confidence;
 const score=Number((impact*.35+likelihood*.25+urgency*.2+uncertainty*5*.2).toFixed(2));
 const priority=score>=4.1?"P0":score>=3.3?"P1":score>=2.4?"P2":"P3";
 const severity=score>=4.1?"critical":score>=3.3?"high":score>=2.4?"medium":"low";
 const evidenceStatus=item.evidenceStatus??"UNVERIFIED";
 const needsEvidence=["UNVERIFIED","CONFLICTED","STALE"].includes(evidenceStatus);
 return {id:item.id,title:item.title,description:item.description??"",score,priority,severity,dimensions:{impact,likelihood,urgency,evidenceConfidence:confidence,uncertainty:Number(uncertainty.toFixed(2))},evidenceStatus,needsEvidenceReview:needsEvidence,recommendedAction:needsEvidence?"Resolve or collect evidence before selecting a fix.":severity==="critical"?"Escalate for human review and define a reversible mitigation.":severity==="high"?"Assign an owner and address in the next controlled change.":"Schedule, monitor and reassess against acceptance criteria."};
}
export function triageCraft(input={}){
 const blockers=Array.isArray(input.blockers)?input.blockers:[];
 if(blockers.length<1||blockers.length>200)throw new TypeError("blockers must contain between 1 and 200 items");
 const seen=new Set();
 for(const item of blockers){
  if(!item||typeof item.id!=="string"||!item.id.trim()||typeof item.title!=="string"||!item.title.trim())throw new TypeError("each blocker requires id and title");
  if(seen.has(item.id))throw new TypeError("blocker ids must be unique");
  seen.add(item.id);
  for(const key of ["impact","likelihood"])if(!Number.isInteger(item[key])||item[key]<1||item[key]>5)throw new TypeError(key+" must be an integer from 1 to 5");
  if(item.urgency!==undefined&&(!Number.isInteger(item.urgency)||item.urgency<1||item.urgency>5))throw new TypeError("urgency must be an integer from 1 to 5");
  if(item.evidenceConfidence!==undefined&&(!Number.isFinite(item.evidenceConfidence)||item.evidenceConfidence<0||item.evidenceConfidence>1))throw new TypeError("evidenceConfidence must be between 0 and 1");
  if(item.evidenceStatus!==undefined&&!["VERIFIED","OBSERVED","INFERRED","UNVERIFIED","CONFLICTED","STALE"].includes(item.evidenceStatus))throw new TypeError("unsupported evidenceStatus");
 }
 const ranked=blockers.map(scoreBlocker).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 return {schema:"cosmos.craft-triage.v1",engine:{name:"COSMOS CRAFT",version:"1.0.0",mode:"deterministic-triage"},generatedAt:new Date().toISOString(),recommendationOnly:true,executionAuthorized:false,priorityOrder:ranked.map(x=>x.id),summary:{total:ranked.length,critical:ranked.filter(x=>x.severity==="critical").length,high:ranked.filter(x=>x.severity==="high").length,needsEvidenceReview:ranked.filter(x=>x.needsEvidenceReview).length},blockers:ranked,governance:{authority:"WARP GATE",defaultDecision:"deny",humanApprovalRequired:true},limitations:["Scores are deterministic prioritization heuristics, not measured probabilities.","Input impact, likelihood, urgency and evidence confidence are caller-supplied and must be independently substantiated.","CRAFT does not modify repositories, execute fixes, grant capabilities or approve releases."]};
}
