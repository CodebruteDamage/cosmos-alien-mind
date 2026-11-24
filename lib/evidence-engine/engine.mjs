import { createHash } from "node:crypto";

export const EVIDENCE_STATUSES=Object.freeze(["VERIFIED","OBSERVED","INFERRED","UNVERIFIED","CONFLICTED","STALE"]);
export const SOURCE_TIERS=Object.freeze(["authoritative","first_party","secondary","unknown"]);
const isoDate=v=>typeof v==="string"&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}T/.test(v)&&Number.isFinite(Date.parse(v));
const clean=v=>typeof v==="string"?v.trim():"";
const digestOf=v=>createHash("sha256").update(v,"utf8").digest("hex");
const norm=v=>clean(String(v??"")).toLowerCase().trim();

function assessOne(record,now,maxAgeDays){
 const issues=[];
 const source=clean(record.source),subject=clean(record.subject),claim=clean(record.claim);
 const collectedAt=record.collectedAt;
 if(!source)issues.push("missing-source");
 if(!subject)issues.push("missing-subject");
 if(!claim)issues.push("missing-claim");
 if(!isoDate(collectedAt))issues.push("invalid-collected-at");
 const tier=SOURCE_TIERS.includes(record.sourceTier)?record.sourceTier:"unknown";
 let integrity={status:"not-provided",algorithm:"SHA-256",digest:null};
 if(typeof record.artifact==="string"){
  const computed=digestOf(record.artifact);
  const supplied=clean(record.digest).toLowerCase();
  integrity={status:supplied?(supplied===computed?"valid":"mismatch"):"computed",algorithm:"SHA-256",digest:computed};
  if(supplied&&supplied!==computed)issues.push("digest-mismatch");
 }else if(record.digest){integrity={status:"unverifiable",algorithm:"SHA-256",digest:clean(record.digest)};issues.push("digest-without-artifact");}
 let status="UNVERIFIED";
 let ageDays=null;
 if(isoDate(collectedAt)){
  ageDays=Math.max(0,(now-Date.parse(collectedAt))/86400000);
  if(ageDays>maxAgeDays)status="STALE";
  else if(record.kind==="inference")status="INFERRED";
  else if(issues.length===0&&tier==="authoritative"&&integrity.status==="valid")status="VERIFIED";
  else if(issues.length===0)status="OBSERVED";
 }
 const completeness=[source,subject,claim,isoDate(collectedAt),clean(record.claimKey),clean(record.value)].filter(Boolean).length/6;
 const provenance=tier==="authoritative"?1:tier==="first_party"?.8:tier==="secondary"?.6:.3;
 const integrityScore=integrity.status==="valid"?1:integrity.status==="computed"?.8:integrity.status==="not-provided"?.35:0;
 const freshness=ageDays===null?0:Math.max(0,1-ageDays/Math.max(maxAgeDays,1));
 const confidence=Number(Math.max(0,Math.min(1,(completeness*.3+provenance*.25+integrityScore*.3+freshness*.15)-(issues.length*.12))).toFixed(3));
 return {evidenceId:clean(record.evidenceId)||null,source,sourceTier:tier,subject,claim,claimKey:clean(record.claimKey)||norm(claim),value:record.value??null,kind:record.kind==="inference"?"inference":"observation",collectedAt:isoDate(collectedAt)?new Date(collectedAt).toISOString():null,status,issues,integrity,quality:{confidence,completeness:Number(completeness.toFixed(3)),provenance:Number(provenance.toFixed(3)),freshness:Number(freshness.toFixed(3))},ageDays:ageDays===null?null:Number(ageDays.toFixed(2)),sourceReference:clean(record.sourceReference)||null};
}

export function evaluateEvidence(input={},options={}){
 const records=Array.isArray(input.records)?input.records:[];
 if(records.length<1||records.length>500)throw new TypeError("records must contain between 1 and 500 items");
 const now=options.now?new Date(options.now):new Date();
 if(!Number.isFinite(now.getTime()))throw new TypeError("invalid evaluation time");
 const maxAgeDays=Number.isFinite(options.maxAgeDays)?Math.max(1,options.maxAgeDays):30;
 const assessed=records.map(r=>assessOne(r||{},now.getTime(),maxAgeDays));
 const groups=new Map();
 for(const item of assessed){
  const key=item.subject+"::"+item.claimKey;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(item);
 }
 const conflicts=[];
 for(const [key,items] of groups){
  const values=[...new Set(items.filter(x=>x.value!==null&&x.status!=="STALE").map(x=>norm(x.value)))];
  if(values.length>1){
   conflicts.push({group:key,evidenceIds:items.map(x=>x.evidenceId),distinctValues:values});
   for(const item of items)if(item.status!=="STALE")item.status="CONFLICTED";
  }
 }
 const counts=Object.fromEntries(EVIDENCE_STATUSES.map(s=>[s,assessed.filter(x=>x.status===s).length]));
 const report={
  schema:"cosmos.evidence-report.v1",engine:{name:"COSMOS EVIDENCE ENGINE",version:"1.0.0",mode:"deterministic-assessment"},
  evaluatedAt:now.toISOString(),recordCount:assessed.length,counts,conflictCount:conflicts.length,
  overallConfidence:assessed.length?Number((assessed.reduce((n,x)=>n+x.quality.confidence,0)/assessed.length).toFixed(3)):0,
  findings:assessed,conflicts,
  limitations:["Confidence is a heuristic quality indicator, not probability of truth.","A matching digest proves artifact consistency, not that its contents are true.","Status VERIFIED requires an authoritative source tier, complete metadata, a supplied artifact and matching SHA-256 digest.","No evidence is persisted by this stateless engine."],
  authorization:{executionAuthorized:false,policyAuthority:"WARP GATE",defaultDecision:"deny"}
 };
 return report;
}

export function createEvidenceStoreAdapterContract(){
 return Object.freeze({append:"async (report) => receipt",read:"async (evidenceId) => record",query:"async (filter) => records",immutability:"append-only; corrections create superseding records",requiredControls:["access control","encryption at rest","retention policy","audit trail","tenant isolation"]});
}
