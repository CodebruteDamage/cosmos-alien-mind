import { getGuidanceModules } from "./modules.mjs";
/**
 * COSMOS BUILD GUIDANCE ENGINE v1.0
 * Deterministic planning only. No execution, permissions, repository writes or deployment.
 */
export const BUILD_TYPES = Object.freeze({
 "BT-01":{id:"BT-01",name:"CORE BUILD",purpose:"Central intelligence, reasoning, planning, context, evidence and provider interfaces.",domains:["THINK","KNOW","GOVERN"],keywords:["reasoning","planning","context","memory","evidence","model","provider","intelligence"]},
 "BT-02":{id:"BT-02",name:"MODULAR BUILD",purpose:"Independent engines and capabilities behind stable, versioned contracts.",domains:["ADAPT","GOVERN","EVOLVE"],keywords:["module","modular","engine","craft","cosmaxx","shape","inspector","warp gate","clc","plugin","contract"]},
 "BT-03":{id:"BT-03",name:"AGENTIC BUILD",purpose:"Agent identity, capability-scoped orchestration, approvals, results and revocation.",domains:["ACT","GOVERN","THINK"],keywords:["agent","agentic","autonomous","orchestration","delegation","task","workforce","approval"]},
 "BT-04":{id:"BT-04",name:"HYBRID BUILD",purpose:"Secure coordination between local devices, workstations, cloud and data services.",domains:["ACT","COMPANION","GOVERN","KNOW"],keywords:["hybrid","android","termux","workstation","local","cloud","device","sync","bridge","neon","adapter","connectivity"]},
 "BT-05":{id:"BT-05",name:"ENTERPRISE BUILD",purpose:"Organizational identity, tenant isolation, administration, policy and audit.",domains:["GOVERN","KNOW","COMPANION"],keywords:["enterprise","tenant","multi-user","multiuser","organization","admin","iam","sso","rbac","compliance"]},
 "BT-06":{id:"BT-06",name:"EDGE BUILD",purpose:"Offline or limited-connectivity operation, local processing and controlled synchronization.",domains:["ADAPT","EVOLVE","KNOW","ACT"],keywords:["edge","offline","local inference","on-device","disconnected","queue","recovery","sync"]}
});
export const BUILD_PROFILES=Object.freeze({
 DEVELOPMENT:"Local engineering, diagnostics and developer test data.",
 PROTOTYPE:"Isolated experiments; no production credentials or production data.",
 INTEGRATION:"Compatibility testing across pinned components and versioned contracts.",
 PRODUCTION:"Controlled release with approval, monitoring, rollback and change records.",
 ENTERPRISE:"Managed organizational configuration with tenant and administrative controls.",
 RECOVERY:"Restoration, backup verification and continuity exercises."
});
export const DOMAINS=Object.freeze({
 THINK:"Reasoning, planning and decision support.",KNOW:"Memory, retrieval, knowledge and evidence.",
 ACT:"Tools, workflows and execution adapters.",GOVERN:"Policy, authorization, approval and audit.",
 ADAPT:"Feedback, optimization and controlled adjustment.",COMPANION:"User interaction, continuity and user-facing controls.",
 EVOLVE:"Evaluation, learning loops and versioned improvement."
});
const MILESTONES=[
 ["M0","Repository baseline","Inspect working tree, branch, commit, dependencies and verified recovery artifacts.",["BT-01","BT-02","BT-03","BT-04","BT-05","BT-06"]],
 ["M1","WARP GATE boundary","Define authorization boundary, deny-by-default policy and adapter contract.",["BT-01","BT-02","BT-03","BT-04","BT-05","BT-06"]],
 ["M2","CLC lifecycle integration","Define task states, transitions, cancellation and lifecycle audit.",["BT-02","BT-03","BT-04"]],
 ["M3","Inspector evidence runtime","Provide reproducible, read-only inspection and evidence reports.",["BT-01","BT-02","BT-04","BT-05","BT-06"]],
 ["M4","CRAFT deterministic triage","Rank blockers using declared evidence, impact, risk and confidence.",["BT-02","BT-03"]],
 ["M5","COSMAXX and SHAPE interfaces","Define measurable optimization and architecture-refinement contracts.",["BT-01","BT-02","BT-05","BT-06"]],
 ["M6","Core orchestration contracts","Version core reasoning, context, evidence and provider interfaces.",["BT-01","BT-02","BT-03"]],
 ["M7","Identity and persistence","Implement authentication, revocation and appropriately isolated persistence.",["BT-03","BT-04","BT-05","BT-06"]],
 ["M8","Agent registry and task scope","Register agents and enforce scoped, expiring, replay-resistant task envelopes.",["BT-03","BT-05"]],
 ["M9","Device and workstation adapters","Integrate approved local/cloud adapters with constrained outbound transport.",["BT-04","BT-06"]],
 ["M10","Integrated verification","Run functional, security, regression, reliability and recovery tests.",["BT-01","BT-02","BT-03","BT-04","BT-05","BT-06"]],
 ["M11","Release-candidate review","Review evidence, unresolved risks, rollback package and explicit release approval.",["BT-01","BT-02","BT-03","BT-04","BT-05","BT-06"]]
];
const CAPS={
 "BT-01":["read:core-contracts","read:context-evidence"],"BT-02":["read:module-registry","write:isolated-feature-branch"],
 "BT-03":["read:agent-registry","request:scoped-task"],"BT-04":["connect:approved-device-adapter","write:device-heartbeat"],
 "BT-05":["read:tenant-policy","admin:tenant-config-review"],"BT-06":["read:offline-cache","request:sync-review"]
};
const norm=v=>typeof v==="string"?v.trim().toLowerCase():"";
function inferProfile(s){
 const t=norm(s);
 if(/restore|backup|disaster recovery|continuity/.test(t))return "RECOVERY";
 if(/production|go live|release|launch|deploy to prod/.test(t))return "PRODUCTION";
 if(/tenant|multi-user|multiuser|enterprise|organization/.test(t))return "ENTERPRISE";
 if(/integrat|connect|bridge|adapter|cross-system/.test(t))return "INTEGRATION";
 if(/prototype|proof of concept|poc|experiment|demo/.test(t))return "PROTOTYPE";
 return "DEVELOPMENT";
}
function risksFor(objective,profile,types){
 const t=norm(objective),r=[];
 if(profile==="PRODUCTION")r.push({id:"production-release",severity:"high",reason:"Production requires explicit release approval, monitoring and rollback evidence."});
 if(/delete|drop database|force.?push|overwrite|destroy|purge|irreversible/.test(t))r.push({id:"destructive-change",severity:"critical",reason:"Inspect a restore point and require human approval; runtime security limits still apply."});
 if(types.includes("BT-03"))r.push({id:"agent-authority",severity:"high",reason:"Agent planning must remain separate from authorization and execution."});
 if(types.includes("BT-04"))r.push({id:"device-boundary",severity:"high",reason:"Device connectivity must be authenticated, revocable, outbound-only by default and capability-limited."});
 if(types.includes("BT-05"))r.push({id:"tenant-isolation",severity:"high",reason:"Tenant isolation must be enforced in API and data layers before multi-user production use."});
 if(types.includes("BT-06"))r.push({id:"offline-policy",severity:"medium",reason:"Queued privileged actions must be re-authorized before synchronization."});
 return r;
}
export function generateBuildGuidance(input={}){
 const objective=typeof input.objective==="string"?input.objective.trim():"";
 if(objective.length<12||objective.length>4000)throw new TypeError("objective must contain between 12 and 4000 characters");
 const ranked=Object.values(BUILD_TYPES).map(type=>{const matchedTerms=type.keywords.filter(k=>norm(objective).includes(k));return{id:type.id,name:type.name,score:matchedTerms.length,matchedTerms};}).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const explicit=Array.isArray(input.buildTypes)&&input.buildTypes.length?[...new Set(input.buildTypes)]:[];
 for(const id of explicit)if(!Object.hasOwn(BUILD_TYPES,id))throw new TypeError("unsupported build type: "+id);
 const inferred=ranked.filter(x=>x.score>0).map(x=>x.id);
 const types=explicit.length?explicit:(inferred.length?inferred:["BT-01","BT-02"]);
 const profile=input.profile||inferProfile(objective);
 if(!Object.hasOwn(BUILD_PROFILES,profile))throw new TypeError("unsupported build profile: "+profile);
 const domains=[...new Set(types.flatMap(id=>BUILD_TYPES[id].domains))];
 if(!domains.includes("GOVERN"))domains.push("GOVERN");
 const modules=getGuidanceModules(types);
 const milestones=MILESTONES.filter(m=>m[3].some(id=>types.includes(id))).map(m=>({id:m[0],title:m[1],objective:m[2],status:"recommended",completionEvidenceRequired:true}));
 const total=ranked.reduce((n,x)=>n+x.score,0),top=ranked[0]?.score||0;
 const confidence=Math.max(.35,Math.min(.95,.45+top/Math.max(total,1)*.35+(explicit.length?.15:0)));
 const capabilities=[...new Set(["read:build-guidance",...types.flatMap(id=>CAPS[id])])];
 return{
  schema:"cosmos.build-guidance.v1",engine:{name:"COSMOS BUILD GUIDANCE ENGINE",version:"1.0.0",mode:"deterministic-recommendation"},
  generatedAt:new Date().toISOString(),recommendationOnly:true,executionAuthorized:false,objective,
  classification:{buildTypes:types.map(id=>({...BUILD_TYPES[id]})),profile:{id:profile,purpose:BUILD_PROFILES[profile]},inferredCandidates:ranked,confidence:Number(confidence.toFixed(2)),confidenceBasis:explicit.length?"user-specified types plus deterministic profile rules":"keyword matches against canonical build-type catalog"},
  domainAlignment:Object.entries(DOMAINS).map(([id,purpose])=>({id,purpose,role:domains.includes(id)?(id==="GOVERN"?"cross-cutting-required":"primary"):"not-selected"})),
  moduleRecommendations:modules,milestones,
  governance:{required:true,authority:"WARP GATE remains authoritative; this engine cannot grant permissions.",defaultDecision:"deny",recommendedCapabilities:capabilities,approvalsRequired:["human approval for production deployment","human approval for destructive or irreversible changes","separate authorization for every privileged execution capability"],controls:["least privilege and capability scoping","credential expiry and revocation","audit logging and evidence provenance","untrusted-data boundary for retrieved content and agent output","no arbitrary shell execution","no wholesale repository merge"]},
  riskAssessment:risksFor(objective,profile,types),
  manifest:{buildId:"ASSIGN-BEFORE-EXECUTION",buildTypes:types,profile,objective,repository:{name:input.repository||"UNSET",branch:"UNSET",startingCommit:"UNSET"},owner:"UNASSIGNED",moduleVersion:"1.0.0",interfaces:[],dependencies:[],dataClassification:"UNCLASSIFIED",secretHandling:"Secrets must remain in approved secret stores; never commit or log credentials.",warpGateCapabilityRequirements:capabilities,tests:[],evidence:[],knownGaps:["Repository baseline and implementation state must be inspected before execution."],rollback:"Define and verify a recovery artifact before any write operation.",acceptance:"PENDING",approver:"UNASSIGNED"},
  acceptanceGates:["baseline and restore point verified","build type and profile confirmed","interfaces and dependencies reviewed","WARP GATE policy and capability requirements approved","tests executed with recorded results","evidence and known gaps attached","rollback verified","release approval recorded when applicable"],
  nextAction:"Inspect the target repository and populate the manifest before implementation. This recommendation does not authorize execution."
 };
}
