"use client";

import { FormEvent, useEffect, useState } from "react";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
};

const modes = [
  { id: "build", label: "Build", icon: "⌘", detail: "Shape a prototype", placeholder: "Describe what you want to build…" },
  { id: "research", label: "Research", icon: "◎", detail: "Explore a question", placeholder: "What topic or question should Cosmos help you research?" },
  { id: "analyze", label: "Analyze", icon: "⌁", detail: "Examine evidence", placeholder: "Describe the problem, evidence, or decision to analyze…" },
  { id: "agent", label: "Create Agent", icon: "✧", detail: "Define a specialist", placeholder: "Define the agent’s role, goal, and boundaries…" },
] as const;

type ModeId = (typeof modes)[number]["id"];

export default function Home() {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<ModeId>("build");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [status, setStatus] = useState("Checking backend…");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

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
        body: JSON.stringify({ title: `[${modes.find((item) => item.id === mode)?.label}] ${trimmed.slice(0, 100)}`, message: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save your message.");
      setMessage("");
      setNotice("Saved to Neon. This prototype does not execute commands or generate AI responses yet.");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save your message.");
    } finally {
      setSaving(false);
    }
  }

  const selectedMode = modes.find((item) => item.id === mode) ?? modes[0];

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><div><strong>COSMOS</strong><small>ALIEN MIND</small></div></div>
        <button className="new-button" onClick={() => { setMessage(""); setNotice("Enter a prompt to start a new saved conversation."); }}>＋ New conversation</button>
        <div className="side-label">MEMORY LOG</div>
        {conversations.length ? conversations.map((item) => (
          <div className="history-item" key={item.id}><span>◌</span><div><strong>{item.title}</strong><small>{item.message_count} saved message{item.message_count === 1 ? "" : "s"}</small></div></div>
        )) : <p className="empty-history">Your saved conversations will appear here.</p>}
        <div className="sidebar-foot"><span className="status-dot" /> Server-side connection<br /><span className="muted">Database status: {status}</span></div>
      </aside>
      <section className="main-panel">
        <header className="topbar"><div className="breadcrumb">COSMOS <span>/</span> ALIEN MIND</div><div className="system-pill"><span className="status-dot" /> {status}</div></header>
        <div className="hero">
          <div className="eyebrow"><span /> PERSONAL INTELLIGENCE SYSTEM</div>
          <div className="particle-field" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => <span className={`matrix-particle particle-${index + 1}`} key={index} />)}
          </div>
          <div className="planet-wrap" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="planet"><div className="planet-shadow" /><div className="planet-glow" /></div><div className="satellite">✧</div></div>
          <h1>Think beyond<br /><em>the known.</em></h1>
          <p className="intro">One command interface for ideas, questions, evidence, and specialist workflows. Choose a mode to shape your next prompt.</p>
          <div className="mode-grid" role="group" aria-label="Choose a Cosmos mode">
            {modes.map((item) => (
              <button type="button" className={`mode-card ${mode === item.id ? "is-selected" : ""}`} aria-pressed={mode === item.id} key={item.id} onClick={() => { setMode(item.id); setNotice(""); }}>
                <span className="mode-icon" aria-hidden="true">{item.icon}</span><span className="mode-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
              </button>
            ))}
          </div>
          <div className="capabilities"><div><span className="cap-icon">◈</span><strong>Neon memory</strong><small>Database connection status</small></div><div><span className="cap-icon">⌘</span><strong>Control core</strong><small>Server-side API foundation</small></div><div><span className="cap-icon">✧</span><strong>AI inference</strong><small>Provider connection pending</small></div></div>
          <form className="prompt-box" onSubmit={submit}>
            <label htmlFor="prompt">COMMAND INTERFACE <span className="mode-label">/ {selectedMode.label.toUpperCase()}</span></label>
            <textarea id="prompt" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={selectedMode.placeholder} maxLength={20000} rows={3} />
            <div className="prompt-footer"><span>{message.length.toLocaleString()} / 20,000</span><button type="submit" disabled={saving || !message.trim()}>{saving ? "Saving…" : "Save prompt ↗"}</button></div>
          </form>
          {notice && <p className="notice" role="status">{notice}</p>}
          <div className="disclaimer">Prototype status: prompts can be saved when Neon is configured and its schema is applied. Build, Research, Analyze, and Create Agent are interface modes only; live AI inference and agent execution are not connected.</div>
        </div>
        <footer className="footer"><span>ALIEN MIND · PROTOTYPE</span><span>OBSERVE · VERIFY · EVOLVE</span></footer>
      </section>
    </main>
  );
}
