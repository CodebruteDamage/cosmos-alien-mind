"use client";

import { FormEvent, useState } from "react";

type Finding = {
  id: string; severity: string; category: string; repository: string;
  subject: string; evidence: string; recommendation: string;
};
type InspectorResult = {
  generatedAt: string;
  mode: string;
  inventory: { repositoryCount: number; branchCount: number; repositories: Array<{name:string;defaultBranch:string;branchCount:number;unprotectedBranchCount:number;unknownProtectionCount:number;workflowCount:number;failingWorkflowCount:number}> };
  findings: Finding[];
  evidence: { overallConfidence: number; counts: Record<string,number>; findings: Array<{status:string;quality:{confidence:number}}> };
  craft: { summary: { total:number;critical:number;high:number;needsEvidenceReview:number }; blockers: Array<{id:string;title:string;priority:string;score:number;recommendedAction:string}> };
  guidance: { classification:{buildTypes:Array<{id:string;name:string}>;profile:{id:string}}; evidenceAssessment?:{recommendationStatus:string;overallConfidence:number}; milestones:Array<{id:string;title:string}>; nextAction:string };
  governance: { executionAuthorized:boolean; writesPerformed:boolean; limitations:string[] };
};

export default function InspectorDashboard() {
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<InspectorResult | null>(null);

  async function inspect(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true); setError("");
    try {
      if (!connected) {
        const session = await fetch("/api/inspector/session", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const sessionData = await session.json();
        if (!session.ok) throw new Error(sessionData.error ?? "Inspector access denied.");
        setToken(""); setConnected(true);
      }
      const response = await fetch("/api/inspector/repositories", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Repository inspection failed.");
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Inspector request failed.");
      if (!connected) setConnected(false);
    } finally { setLoading(false); }
  }

  async function disconnect() {
    await fetch("/api/inspector/session", { method: "DELETE" });
    setConnected(false); setReport(null); setToken(""); setError("");
  }

  return (
    <section className="inspector-panel" aria-labelledby="inspector-title">
      <div className="inspector-heading">
        <div><div className="eyebrow">REPOSITORY INTELLIGENCE</div><h2 id="inspector-title">C-INSPECTOR</h2><p>Read-only GitHub inventory, evidence assessment, CRAFT triage and build guidance.</p></div>
        <span className={connected ? "inspector-state connected" : "inspector-state"}>{connected ? "SESSION ACTIVE" : "LOCKED"}</span>
      </div>
      {!connected && <form className="inspector-connect" onSubmit={inspect}>
        <label htmlFor="inspector-token">INSPECTOR ACCESS TOKEN</label>
        <input id="inspector-token" type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} placeholder="Enter server-configured access token" minLength={24} maxLength={512} required />
        <button type="submit" disabled={loading || token.length < 24}>{loading ? "Connecting…" : "Connect Inspector"}</button>
      </form>}
      {connected && <div className="inspector-actions"><button type="button" onClick={()=>void inspect()} disabled={loading}>{loading ? "Inspecting…" : "Refresh repository inventory"}</button><button type="button" className="subtle-button" onClick={()=>void disconnect()}>Disconnect</button></div>}
      {error && <p className="inspector-error" role="alert">{error}</p>}
      {report && <>
        <div className="inspector-stats">
          <div><strong>{report.inventory.repositoryCount}</strong><span>Repositories</span></div>
          <div><strong>{report.inventory.branchCount}</strong><span>Branches</span></div>
          <div><strong>{report.findings.length}</strong><span>Findings</span></div>
          <div><strong>{Math.round((report.evidence.overallConfidence ?? 0)*100)}%</strong><span>Evidence quality</span></div>
        </div>
        <div className="inspector-subheading">REPOSITORY INVENTORY</div>
        <div className="inspector-repos">{report.inventory.repositories.map(repo=><article key={repo.name}>
          <div><strong>{repo.name}</strong><small>Default: {repo.defaultBranch}</small></div>
          <span>{repo.branchCount} branches</span><span>{repo.unprotectedBranchCount} unprotected</span><span>{repo.unknownProtectionCount} unknown</span><span>{repo.failingWorkflowCount} failed runs</span>
        </article>)}</div>
        <div className="inspector-subheading">CRAFT PRIORITY QUEUE</div>
        {report.craft.blockers.length ? <div className="inspector-findings">{report.craft.blockers.map(item=><article key={item.id}>
          <span className={"priority priority-"+item.priority.toLowerCase()}>{item.priority}</span><div><strong>{item.title}</strong><small>{item.recommendedAction}</small></div><b>{item.score.toFixed(2)}</b>
        </article>)}</div> : <p className="inspector-empty">No current blockers were identified from the supplied GitHub inventory.</p>}
        <div className="inspector-subheading">BUILD GUIDANCE</div>
        <div className="inspector-guidance">
          <div><strong>{report.guidance.classification.profile.id}</strong><small>Recommended profile</small></div>
          <div><strong>{report.guidance.classification.buildTypes.map(x=>x.id).join(" · ")}</strong><small>Build types</small></div>
          <div><strong>{report.guidance.evidenceAssessment?.recommendationStatus ?? "NOT ASSESSED"}</strong><small>Evidence gate</small></div>
        </div>
        <p className="inspector-next">{report.guidance.nextAction}</p>
        <p className="inspector-disclaimer">Read-only mode. No branches or repository settings were changed. Execution authorized: no. Evidence is in-memory and not persisted.</p>
      </>}
    </section>
  );
}
