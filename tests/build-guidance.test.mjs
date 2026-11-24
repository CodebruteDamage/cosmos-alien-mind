import test from "node:test";
import assert from "node:assert/strict";
import {generateBuildGuidance} from "../lib/build-guidance/engine.mjs";
test("Termux bridge maps to hybrid integration",()=>{const r=generateBuildGuidance({objective:"Integrate Android Termux device bridge with cloud Neon heartbeat"});assert.ok(r.classification.buildTypes.some(x=>x.id==="BT-04"));assert.equal(r.classification.profile.id,"INTEGRATION");assert.equal(r.executionAuthorized,false);});
test("GOVERN is always cross-cutting",()=>{const r=generateBuildGuidance({objective:"Build an offline edge inference cache"});assert.equal(r.domainAlignment.find(x=>x.id==="GOVERN").role,"cross-cutting-required");});
test("production profile adds release risk",()=>{const r=generateBuildGuidance({objective:"Deploy the COSMOS service to production"});assert.equal(r.classification.profile.id,"PRODUCTION");assert.ok(r.riskAssessment.some(x=>x.id==="production-release"));});
test("destructive intent is flagged",()=>{const r=generateBuildGuidance({objective:"Delete old database records and rebuild the system"});assert.ok(r.riskAssessment.some(x=>x.id==="destructive-change"));});
test("explicit types override inference",()=>{const r=generateBuildGuidance({objective:"Connect Android to cloud",buildTypes:["BT-02"]});assert.deepEqual(r.classification.buildTypes.map(x=>x.id),["BT-02"]);});
test("invalid input is rejected",()=>{assert.throws(()=>generateBuildGuidance({objective:"short"}),/objective/);assert.throws(()=>generateBuildGuidance({objective:"Build a modular system",buildTypes:["BT-99"]}),/unsupported build type/);});
test("recommendations never grant execution",()=>{const r=generateBuildGuidance({objective:"Create an agentic autonomous workflow engine"});assert.equal(r.executionAuthorized,false);assert.equal(r.governance.defaultDecision,"deny");assert.ok(r.governance.approvalsRequired.length>=3);});

test("modular guidance registry exposes eight distinct modules",()=>{
 const r=generateBuildGuidance({objective:"Integrate Android Termux device bridge with cloud Neon heartbeat"});
 assert.equal(r.moduleRecommendations.length,8);
 assert.equal(new Set(r.moduleRecommendations.map(x=>x.id)).size,8);
 assert.ok(r.moduleRecommendations.some(x=>x.id==="integration"));
 assert.ok(r.moduleRecommendations.some(x=>x.id==="risk-craft"));
});

import {attachEvidenceAssessment} from "../lib/build-guidance/evidence-adapter.mjs";
import {evaluateEvidence} from "../lib/evidence-engine/engine.mjs";
test("evidence assessment is attached without granting execution",()=>{
 const guidance=generateBuildGuidance({objective:"Build a modular evidence-backed integration engine"});
 const report=evaluateEvidence({records:[{source:"unit-test",sourceTier:"first_party",subject:"build",claim:"Tests completed",value:"pass",collectedAt:"2026-11-24T12:00:00Z"}]},{now:"2026-11-24T13:00:00Z"});
 const integrated=attachEvidenceAssessment(guidance,report);
 assert.equal(integrated.evidenceAssessment.recommendationStatus,"EVIDENCE_ASSESSED");
 assert.equal(integrated.executionAuthorized,false);
});
test("conflicted evidence requires review",()=>{
 const guidance=generateBuildGuidance({objective:"Build a modular evidence-backed integration engine"});
 const common={source:"test",sourceTier:"first_party",subject:"build",claim:"Tests",claimKey:"tests",collectedAt:"2026-11-24T12:00:00Z"};
 const report=evaluateEvidence({records:[{...common,value:"pass"},{...common,value:"fail"}]},{now:"2026-11-24T13:00:00Z"});
 const integrated=attachEvidenceAssessment(guidance,report);
 assert.equal(integrated.evidenceAssessment.recommendationStatus,"EVIDENCE_REVIEW_REQUIRED");
 assert.equal(integrated.executionAuthorized,false);
});
