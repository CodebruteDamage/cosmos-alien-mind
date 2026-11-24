/**
 * COSMOS Guidance Module Registry v1.0
 * Pure recommendation modules. Modules cannot execute work or grant permissions.
 */
export const GUIDANCE_MODULES = Object.freeze([
 {id:"classification",name:"Build Classification",purpose:"Select build types and profiles from the objective.",types:["BT-01","BT-02","BT-03","BT-04","BT-05","BT-06"],required:true},
 {id:"architecture",name:"Architecture Guidance",purpose:"Recommend architecture boundaries, interfaces and module composition.",types:["BT-01","BT-02","BT-05"],required:false},
 {id:"dependencies",name:"Dependency Guidance",purpose:"Identify prerequisites, dependency order and integration contracts.",types:["BT-01","BT-02","BT-03","BT-04","BT-05","BT-06"],required:true},
 {id:"risk-craft",name:"Risk and CRAFT Guidance",purpose:"Identify blockers, risks, impact and evidence gaps.",types:["BT-02","BT-03","BT-04","BT-05","BT-06"],required:true},
 {id:"optimization",name:"Optimization Guidance",purpose:"Provide measurable optimization recommendations through COSMAXX.",types:["BT-02","BT-05","BT-06"],required:false},
 {id:"integration",name:"Integration Guidance",purpose:"Coordinate module contracts, adapters and compatibility checks.",types:["BT-02","BT-03","BT-04","BT-05","BT-06"],required:true},
 {id:"validation",name:"Testing and Validation",purpose:"Define tests, evidence requirements and acceptance criteria.",types:["BT-01","BT-02","BT-03","BT-04","BT-05","BT-06"],required:true},
 {id:"release-recovery",name:"Release and Recovery",purpose:"Define release gates, rollback and recovery evidence.",types:["BT-01","BT-02","BT-03","BT-04","BT-05","BT-06"],required:true}
]);
export function getGuidanceModules(buildTypes=[]) {
 return GUIDANCE_MODULES
  .filter(module=>module.required||module.types.some(type=>buildTypes.includes(type)))
  .map(({id,name,purpose,required})=>({id,name,purpose,requirement:required?"mandatory":"recommended"}));
}
