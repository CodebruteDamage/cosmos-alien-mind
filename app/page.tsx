"use client";

import { FormEvent, useEffect, useState } from "react";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
};

const workspaces = [
  { id: "overview", label: "Command overview", group: "COMMAND" },
  { id: "departments", label: "Departments", group: "ECOSYSTEM" },
  { id: "engines", label: "Engine registry", group: "ECOSYSTEM" },
  { id: "powerbox", label: "POWERBOX", group: "ECOSYSTEM" },
  { id: "hosts", label: "Hosts & infrastructure", group: "ECOSYSTEM" },
  { id: "workflows", label: "Workflows", group: "OPERATIONS" },
  { id: "governance", label: "Governance", group: "ASSURANCE" },
  { id: "evidence", label: "Evidence", group: "ASSURANCE" },
  { id: "business", label: "Business solutions", group: "OPERATIONS" },
] as const;

const moduleDetails: Record<string, { title: string; description: string; capabilities: string[] }> = {
  departments: {
    title: "Department workspace",
    description: "A modular home for department-owned engines, responsibilities, and operational views.",
    capabilities: ["Intelligence", "Engineering", "Operations", "Cyber Sec Ops", "Knowledge", "Business Solutions"],
  },
  engines: {
    title: "Engine registry",
    description: "A governed catalogue of independent COSMOS engines, their versions, owners, and verified readiness.",
    capabilities: ["Engine identity and version", "Ownership and lifecycle", "Standalone readiness", "Evidence-backed status"],
  },
  powerbox: {
    title: "POWERBOX",
    description: "The capability infrastructure for standalone engines, multi-engine compositions, and multi-host coordination.",
    capabilities: ["Engine registration", "Composition plans", "Dependency visibility", "Host-aware execution"],
  },
  hosts: {
    title: "Hosts & infrastructure",
    description: "A future operational view of authorized local, cloud, remote, and edge hosts.",
    capabilities: ["Host inventory", "Connectivity state", "Resource telemetry", "Last verified heartbeat"],
  },
  workflows: {
    title: "Workflow operations",
    description: "A view of approved workflows, their lifecycle, dependencies, and execution evidence.",
    capabilities: ["Workflow catalogue", "Stage progression", "Approval checkpoints", "Failure and recovery history"],
  },
  governance: {
    title: "Governance center",
    description: "A visibility layer for WARP GATE decisions, permissions, approvals, and policy outcomes.",
    capabilities: ["Authorization state", "Policy decisions", "Human approvals", "Audit trail"],
  },
  evidence: {
    title: "Evidence center",
    description: "Traceable records that distinguish observed facts, inferred findings, validation, and certification.",
    capabilities: ["Evidence references", "Source and timestamp", "Integrity state", "Validation history"],
  },
  business: {
    title: "Business solutions",
    description: "Business-specific workspaces built from reusable COSMOS capabilities and customer-approved adapters.",
    capabilities: ["Customer profiles", "Solution modules", "Integration status", "Operational outcomes"],
  },
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [status, setStatus] = useState("Checking backend…");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [active, setActive] = useState<string>("overview");

  async function refresh() {
    try {
      const [health, history] = await Promise.all([
        fetch("/api/health", { cache: "no-store" }),
        fetch("/api/conversations", { cache: "no-store" }),
      ]);
      const healthData = await health.json();
      setStatus(healthData.database === "connected" ? "Neon connected" :
        healthData.database === "not_configured" ? "Neon setup required" : "Backend needs attention");
      if (history.ok) {
        const data = await history.json();
        setConversations(data.conversations ?? []);
      }
    } catch {
      setStatus("Backend unreachable");
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save your message.");
      setMessage("");
      setNotice("Saved to Neon. AI inference is not connected yet.");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save your message.");
    } finally {
      setSaving(false);
    }
  }

  const selected = moduleDetails[active];

  return (
    <main className="omni-shell">
      <aside className="omni-sidebar">
        <a className="brand" href="/" aria-label="COSMOS OmniBoard home">
          <span className="brand-mark">✦</span>
          <span><strong>COSMOS</strong><small>OMNIBOARD</small></span>
        </a>
        <div className="sidebar-caption">UNIFIED COMMAND</div>
        {["COMMAND", "ECOSYSTEM", "OPERATIONS", "ASSURANCE"].map((group) => (
          <nav className="nav-group" key={group} aria-label={group}>
            <div className="nav-heading">{group}</div>
            {workspaces.filter((item) => item.group === group).map((item) => (
              <button key={item.id} className={active === item.id ? "nav-item active" : "nav-item"}
                onClick={() => { setActive(item.id); setNotice(""); }}>
                <span className="nav-indicator" />{item.label}
              </button>
            ))}
          </nav>
        ))}
        <div className="sidebar-memory">
          <div className="nav-heading">MEMORY LOG</div>
          {conversations.length ? conversations.slice(0, 5).map((item) => (
            <div className="memory-item" key={item.id}>
              <strong>{item.title}</strong>
              <small>{item.message_count} saved message{item.message_count === 1 ? "" : "s"}</small>
            </div>
          )) : <p>No saved conversations yet.</p>}
        </div>
        <div className="sidebar-foot">
          <span className="status-dot" />{status}
          <small>Backend connectivity only · no AI inference</small>
        </div>
      </aside>

      <section className="omni-main">
        <header className="topbar">
          <div><div className="eyebrow">COSMOS ECOSYSTEM</div><div className="page-title">{workspaces.find((item) => item.id === active)?.label}</div></div>
          <div className="topbar-right"><span className="system-pill"><span className="status-dot" />{status}</span><span className="version-tag">OMNIBOARD · FOUNDATION</span></div>
        </header>

        {active === "overview" ? (
          <div className="content">
            <section className="welcome-panel">
              <div className="welcome-copy">
                <div className="eyebrow"><span className="eyebrow-dot" /> UNIFIED INTELLIGENCE & OPERATIONS</div>
                <h1>One ecosystem.<br /><em>One command view.</em></h1>
                <p>Observe COSMOS departments, engines, workflows, infrastructure, and governance from one modular workspace.</p>
              </div>
              <div className="orbit-art" aria-hidden="true"><div className="orbit-ring ring-a" /><div className="orbit-ring ring-b" /><div className="orbit-core">C</div><i className="orbit-node node-a" /><i className="orbit-node node-b" /><i className="orbit-node node-c" /></div>
            </section>

            <div className="section-heading"><div><div className="eyebrow">SYSTEM SNAPSHOT</div><h2>Operational overview</h2></div><span className="snapshot-note">Live values only where connected</span></div>
            <section className="metric-grid">
              <article className="metric-card"><span className="metric-label">DATABASE</span><strong className="metric-value">{status === "Neon connected" ? "Connected" : status}</strong><small>Verified through /api/health</small></article>
              <article className="metric-card"><span className="metric-label">AI INFERENCE</span><strong className="metric-value pending">Not connected</strong><small>No model responses generated</small></article>
              <article className="metric-card"><span className="metric-label">AUTHENTICATION</span><strong className="metric-value pending">Not implemented</strong><small>Not ready for multi-user access</small></article>
              <article className="metric-card"><span className="metric-label">SAVED CONVERSATIONS</span><strong className="metric-value">{conversations.length}</strong><small>Records returned by current API</small></article>
            </section>

            <div className="section-heading"><div><div className="eyebrow">COSMOS STRUCTURE</div><h2>Workspace directory</h2></div></div>
            <section className="workspace-grid">
              {workspaces.filter((item) => item.id !== "overview").map((item) => (
                <button className="workspace-card" key={item.id} onClick={() => setActive(item.id)}>
                  <span className="workspace-group">{item.group}</span><strong>{item.label}</strong><small>Workspace shell · integration pending</small><span className="card-arrow">↗</span>
                </button>
              ))}
            </section>

            <section className="capture-panel">
              <div className="section-heading"><div><div className="eyebrow">INTELLIGENCE WORKSPACE</div><h2>Capture a thought</h2></div><span className="snapshot-note">Storage only · AI disabled</span></div>
              <form className="prompt-box" onSubmit={submit}>
                <label htmlFor="prompt">NEW SAVED CONVERSATION</label>
                <textarea id="prompt" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Capture an idea or record a task for later…" maxLength={20000} rows={3} />
                <div className="prompt-footer"><span>{message.length.toLocaleString()} / 20,000</span><button type="submit" disabled={saving || !message.trim()}>{saving ? "Saving…" : "Save to Cosmos ↗"}</button></div>
              </form>
              {notice && <p className="notice" role="status">{notice}</p>}
            </section>
          </div>
        ) : selected ? (
          <div className="content module-content">
            <section className="module-intro">
              <div className="eyebrow">COSMOS WORKSPACE · DESIGN BASELINE</div>
              <h1>{selected.title}</h1>
              <p>{selected.description}</p>
              <span className="state-label">NOT CONNECTED · FOUNDATION VIEW</span>
            </section>
            <div className="section-heading"><div><div className="eyebrow">PLANNED CAPABILITIES</div><h2>Workspace components</h2></div></div>
            <section className="workspace-grid">
              {selected.capabilities.map((capability) => (
                <article className="capability-card" key={capability}><span className="capability-mark">◇</span><strong>{capability}</strong><small>Defined capability · implementation not verified</small></article>
              ))}
            </section>
            <div className="boundary-note"><strong>Integration boundary</strong><p>This workspace is currently a navigation and presentation foundation. It does not claim live engine telemetry, authorization decisions, workflow execution, evidence records, or host control. Those require their respective governed integrations.</p></div>
          </div>
        ) : null}

        <footer className="footer"><span>COSMOS OMNIBOARD · V1 FOUNDATION</span><span>OBSERVE · VERIFY · COORDINATE</span></footer>
      </section>
    </main>
  );
}
