import test from "node:test";
import assert from "node:assert/strict";
import {triageCraft} from "../lib/craft/engine.mjs";
test("CRAFT deterministically ranks high-impact blockers first",()=>{const r=triageCraft({blockers:[{id:"B2",title:"Minor",impact:1,likelihood:1,urgency:1,evidenceConfidence:.9,evidenceStatus:"VERIFIED"},{id:"B1",title:"Critical",impact:5,likelihood:5,urgency:5,evidenceConfidence:.2,evidenceStatus:"UNVERIFIED"}]});assert.equal(r.priorityOrder[0],"B1");assert.equal(r.blockers[0].priority,"P0");});
test("unverified evidence requires evidence review",()=>{const r=triageCraft({blockers:[{id:"B1",title:"Unknown blocker",impact:3,likelihood:3,evidenceStatus:"UNVERIFIED"}]});assert.equal(r.summary.needsEvidenceReview,1);});
test("CRAFT never grants execution authority",()=>{const r=triageCraft({blockers:[{id:"B1",title:"Blocker",impact:2,likelihood:2}]});assert.equal(r.executionAuthorized,false);assert.equal(r.governance.defaultDecision,"deny");});
test("invalid scales and duplicate IDs are rejected",()=>{assert.throws(()=>triageCraft({blockers:[{id:"B",title:"Bad",impact:6,likelihood:2}]}));assert.throws(()=>triageCraft({blockers:[{id:"B",title:"One",impact:2,likelihood:2},{id:"B",title:"Two",impact:2,likelihood:2}]}));});
