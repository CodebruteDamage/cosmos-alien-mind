"use client";

import { useMemo, useState } from "react";
import styles from "./office.module.css";
import { DEMO_WORKERS } from "./workspace-contracts";
import type { CraftBlocker, CraftRemediationPlan } from "./craft-contracts";

type View = "overview" | "workforce" | "maxx" | "craft" | "docs" | "slides" | "design" | "sheets" | "boards" | "data" | "motion" | "code" | "browser";
const modules: {id: View; name: string; category: string; symbol: string; summary: string}[] = [
 {id:"workforce",name:"Workforce Live",category:"Workforce",symbol:"◉",summary:"Employee registry, missions and lifecycle activity"},
 {id:"maxx",name:"MAXX Analyzer",category:"Intelligence",symbol:"⌘",summary:"Multi-analyzer boards, evidence and confidence"},
 {id:"craft",name:"CRAFT Blockers",category:"Engineering",symbol:"⚒",summary:"Evidence-linked blocker triage and remediation proposals"},
 {id:"docs",name:"Docs",category:"Create",symbol:"▤",summary:"Documents, specifications and reports"},
 {id:"slides",name:"Slides",category:"Create",symbol:"▥",summary:"Presentations and briefings"},
 {id:"design",name:"Design",category:"Create",symbol:"✳",summary:"Visual concepts and assets"},
 {id:"sheets",name:"Sheets",category:"Operate",symbol:"▦",summary:"Structured data and calculations"},
 {id:"boards",name:"Boards",category:"Operate",symbol:"▥",summary:"Projects, missions and delivery tracking"},
 {id:"data",name:"Data",category:"Operate",symbol:"◫",summary:"Metrics and evidence-linked analytics"},
 {id:"motion",name:"Motion",category:"Create",symbol:"▶",summary:"Storyboards and media workflows"},
 {id:"code",name:"Code",category:"Engineering",symbol:"</>",summary:"Repositories, changes and build evidence"},
 {id:"browser",name:"Browser",category:"Engineering",symbol:"◎",summary:"Authorized research and web workflows"},
];
const demoFindings = [
 {label:"Evidence coverage",value:72,detail:"Illustrative fixture only"},
 {label:"Source freshness",value:84,detail:"Illustrative fixture only"},
 {label:"Confidence rationale",value:61,detail:"Illustrative fixture only"},
];
export default function CosmosOfficePage(){
 const [active,setActive]=useState<View>("overview");
 const [query,setQuery]=useState("");
 const [reducedMotion,setReducedMotion]=useState(false);
 const [craftBlockers,setCraftBlockers]=useState<CraftBlocker[]>([]);
 const [craftPlan,setCraftPlan]=useState<CraftRemediationPlan|null>(null);
 const [craftLoading,setCraftLoading]=useState(false);
 const [craftError,setCraftError]=useState("");
 useEffect(()=>{ if(active!=="craft") return; let alive=true; fetch("/api/office/craft").then(r=>r.json()).then(data=>{if(alive)setCraftBlockers(data.blockers??[])}).catch(()=>{if(alive)setCraftError("Unable to load the blocker fixture.")}); return ()=>{alive=false}; },[active]);
 const generatePlan=async(blockerId:string)=>{setCraftLoading(true);setCraftError("");setCraftPlan(null);try{const response=await fetch("/api/office/craft",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({blockerId})});const data=await response.json();if(!response.ok)throw new Error(data.error??"Plan generation failed.");setCraftPlan(data.plan)}catch(error){setCraftError(error instanceof Error?error.message:"Plan generation failed.")}finally{setCraftLoading(false)}};
 const filtered=useMemo(()=>modules.filter(m=>(m.name+" "+m.summary).toLowerCase().includes(query.toLowerCase())),[query]);
 const select=(id:View)=>setActive(id);
 return <main className={styles.shell}>
  <aside className={styles.sidebar}>
   <a className={styles.brand} href="/"><span className={styles.brandMark}>✦</span><span><strong>COSMOS</strong><small>OFFICE</small></span></a>
   <div className={styles.workspaceLabel}>WORKSPACE</div>
   <button className={active==="overview"?styles.navActive:styles.navItem} onClick={()=>select("overview")}><span>⌂</span> Command overview</button>
   <button className={active==="workforce"?styles.navActive:styles.navItem} onClick={()=>select("workforce")}><span>◉</span> Workforce Live <i className={styles.demoDot}/></button>
   <button className={active==="maxx"?styles.navActive:styles.navItem} onClick={()=>select("maxx")}><span>⌘</span> MAXX Analyzer</button>
   <button className={active==="craft"?styles.navActive:styles.navItem} onClick={()=>select("craft")}><span>⚒</span> CRAFT Blockers</button>
   <div className={styles.workspaceLabel}>APPLICATIONS</div>
   {modules.filter(m=>!["workforce","maxx","craft"].includes(m.id)).map(m=><button key={m.id} className={active===m.id?styles.navActive:styles.navItem} onClick={()=>select(m.id)}><span>{m.symbol}</span>{m.name}</button>)}
   <div className={styles.sidebarFoot}><span className={styles.statusDot}/><span>Development preview</span><small>Demo fixtures · integrations pending</small></div>
  </aside>
  <section className={styles.main}>
   <header className={styles.topbar}><div className={styles.crumb}>COSMOS <span>/</span> OFFICE <span>/</span> {active.toUpperCase()}</div><div className={styles.topActions}><span className={styles.previewTag}>DEV PREVIEW · NOT LIVE</span><span className={styles.avatar}>F</span></div></header>
   <div className={styles.content}>
    {active==="overview" && <>
     <div className={styles.heroRow}><div><div className={styles.eyebrow}>UNIFIED OPERATING ENVIRONMENT</div><h1>One office.<br/><em>Many capabilities.</em></h1><p className={styles.intro}>A modular workspace for human operators, AI workforce and specialist applications. Shared identity, evidence and authorization boundaries are designed into the platform.</p></div><div className={styles.orbit}><div className={styles.orbitRing}/><div className={styles.orbitCore}>C</div><span className={styles.orbitDot}/></div></div>
     <div className={styles.metrics}><div><span>APPLICATIONS</span><strong>11</strong><small>Catalogued workspaces</small></div><div><span>LIVE WORKERS</span><strong>—</strong><small>No live registry connection</small></div><div><span>EXECUTION</span><strong>LOCKED</strong><small>WARP GATE integration pending</small></div></div>
     <div className={styles.sectionHead}><div><div className={styles.eyebrow}>WORKSPACE DIRECTORY</div><h2>Integrated workspaces</h2></div><input aria-label="Search modules" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search applications…"/></div>
     <div className={styles.moduleGrid}>{filtered.map(m=><article className={styles.moduleCard} key={m.id}><div className={styles.cardTop}><span className={styles.cardSymbol}>{m.symbol}</span><span className={styles.cardStatus}>{m.id==="maxx"||m.id==="workforce"?"PROTOTYPE":"FOUNDATION"}</span></div><h3>COSMOS {m.name.toUpperCase()}</h3><p>{m.summary}</p><button onClick={()=>select(m.id)}>Open workspace <span>↗</span></button></article>)}</div>
     {filtered.length===0&&<div className={styles.empty}>No matching workspace.</div>}
     <section className={styles.governance}><div className={styles.governanceIcon}>▣</div><div><div className={styles.eyebrow}>SHARED GOVERNANCE</div><h2>WARP GATE controls execution.</h2><p>Identity · Capability grants · Scope validation · Human approval · Evidence · Audit trail</p></div><span className={styles.lock}>EXECUTION LOCKED</span></section>
    </>}
    {active==="workforce" && <><button className={styles.backLink} onClick={()=>select("overview")}>← Overview</button><div className={styles.eyebrow}>WORKFORCE OPERATIONS</div><h1 className={styles.pageTitle}>Workforce <em>Live</em></h1><p className={styles.intro}>Registry and event-driven workforce view. The workers below are demo fixtures, not connected employees or active agents.</p><div className={styles.noticeBar}>DEMO DATA ONLY · No live event stream connected · Last event: unavailable</div><div className={styles.workerGrid}>{DEMO_WORKERS.map((w,i)=><article className={styles.workerCard} key={w.workerId}><div className={styles.workerHead}><div className={styles.workerAvatar}>{w.displayName.slice(0,1)}</div><span className={styles.demoPill}>DEMO</span></div><h3>{w.displayName}</h3><p>{w.role}</p><div className={styles.workerState}><span className={styles.neutralDot}/> Registered fixture · status not connected</div><small>{w.capabilityIds.join(" · ")}</small></article>)}</div><div className={styles.panel}><div className={styles.panelTitle}>EVENT STREAM</div><p className={styles.mutedText}>Waiting for authenticated workforce events. Animations are disabled until authoritative lifecycle events are available.</p><button className={styles.secondaryButton} onClick={()=>setReducedMotion(!reducedMotion)}>{reducedMotion?"Enable ambient motion":"Reduce motion"}</button><p className={styles.mutedText}>Preference: {reducedMotion?"Reduced motion":"Standard motion"} · Visual preference only</p></div></>}
    {active==="maxx" && <><button className={styles.backLink} onClick={()=>select("overview")}>← Overview</button><div className={styles.eyebrow}>MULTI-ANALYZER INTELLIGENCE</div><h1 className={styles.pageTitle}>COSMOS <em>MAXX</em></h1><p className={styles.intro}>Evidence-led analysis workspaces. All values below are illustrative fixtures to demonstrate the board layout, not measured system results.</p><div className={styles.noticeBar}>ILLUSTRATIVE BOARD · No production analyzers connected · Scores are not operational measurements</div><div className={styles.maxxGrid}>{demoFindings.map(f=><article className={styles.maxxCard} key={f.label}><div className={styles.panelTitle}>{f.label.toUpperCase()}</div><div className={styles.score}>{f.value}<small>/100</small></div><div className={styles.meter}><span style={{width:f.value+"%"}}/></div><p>{f.detail}</p></article>)}</div><div className={styles.detailGrid}><section className={styles.panel}><div className={styles.panelTitle}>ANALYZER REGISTRY</div>{["Evidence Analyzer","Confidence Analyzer","Benchmark Analyzer","Optimization Analyzer"].map(x=><div className={styles.capabilityRow} key={x}><span>◇</span>{x}<small>Not connected</small></div>)}</section><section className={styles.panel}><div className={styles.panelTitle}>BOARD PRINCIPLES</div><div className={styles.capabilityRow}>Separate observations, inferences and recommendations</div><div className={styles.capabilityRow}>Show source provenance and freshness</div><div className={styles.capabilityRow}>Never invent scores when evidence is missing</div><div className={styles.capabilityRow}>Recommendations cannot authorize execution</div></section></div></>}
    {active==="craft" && <><button className={styles.backLink} onClick={()=>select("overview")}>← Overview</button><div className={styles.eyebrow}>MAXX → CRAFT · BLOCKER OPERATIONS</div><h1 className={styles.pageTitle}>CRAFT <em>Blocker Desk</em></h1><p className={styles.intro}>Blockers are linked to MAXX analysis IDs and source evidence. Plan generation is advisory only; no repository changes or commands are executed here.</p><div className={styles.noticeBar}>DEMO SOURCE · Historical CI fixture · Live CI ingestion is not connected</div>{craftError&&<div className={styles.noticeBar}>{craftError}</div>}<div className={styles.panel}><div className={styles.panelTitle}>INGESTED BLOCKERS · {craftBlockers.length}</div>{craftBlockers.map(blocker=><article className={styles.blockerCard} key={blocker.blockerId}><div className={styles.blockerTop}><div><span className={styles.blockerSeverity}>{blocker.severity.toUpperCase()}</span><h3>{blocker.title}</h3></div><span className={styles.demoPill}>FIXTURE</span></div><p>{blocker.description}</p><div className={styles.blockerMeta}>Category: {blocker.category} · Status: {blocker.status} · MAXX refs: {blocker.analysisIds.join(", ")}</div>{blocker.evidence.map(item=><div className={styles.evidenceRow} key={item.evidenceId}><strong>{item.evidenceId}</strong><span>{item.source}</span><small>{item.description}</small></div>)}<button className={styles.secondaryButton} disabled={craftLoading} onClick={()=>generatePlan(blocker.blockerId)}>{craftLoading?"Generating proposal…":"Generate remediation proposal"}</button></article>)}</div>{craftPlan&&<section className={styles.panel+" "+styles.planPanel}><div className={styles.panelTitle}>CRAFT REMEDIATION PLAN · DRAFT</div><div className={styles.noticeBar}>PROPOSAL ONLY · NOT APPROVED · NOT EXECUTABLE</div><ol className={styles.planSteps}>{craftPlan.steps.map(step=><li key={step.stepId}><strong>{step.description}</strong><small>Risk: {step.risk} · Reversible: {step.reversible?"Yes":"No"}</small><small>Expected evidence: {step.expectedEvidence.join(" · ")}</small></li>)}</ol><h3>Rollback plan</h3><p>{craftPlan.rollbackPlan}</p><h3>Verification criteria</h3><ul>{craftPlan.verificationCriteria.map(item=><li key={item}>{item}</li>)}</ul><div className={styles.noticeBar}>WARP GATE approval and a separately authorized execution adapter are required before any remediation can be applied.</div></section>}</>}
    {!["overview","workforce","maxx","craft"].includes(active)&&<><button className={styles.backLink} onClick={()=>select("overview")}>← Overview</button><div className={styles.eyebrow}>APPLICATION WORKSPACE</div><h1 className={styles.pageTitle}>COSMOS <em>{modules.find(m=>m.id===active)?.name.toUpperCase()}</em></h1><p className={styles.intro}>{modules.find(m=>m.id===active)?.summary}. This workspace is catalogued but its service integration is not connected.</p><div className={styles.noticeBar}>FOUNDATION INTERFACE · SERVICE NOT CONNECTED</div><section className={styles.gatePanel}><div><div className={styles.panelTitle}>WARP GATE · ACCESS POLICY</div><strong>Execution is not enabled from this interface.</strong><p>Module visibility does not grant permission. Actions require a server-side capability decision, scope validation, audit record, and applicable human approval.</p></div><span className={styles.lock}>LOCKED</span></section></>}
    <footer className={styles.footer}><span>COSMOS OFFICE · MAXX + WORKFORCE PROTOTYPE</span><span>OBSERVE · VERIFY · AUTHORIZE</span></footer>
   </div>
  </section>
 </main>;
}
