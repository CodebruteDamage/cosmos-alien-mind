"use client";

import { FormEvent, useEffect, useState } from "react";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [status, setStatus] = useState("Checking backend…");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [answer, setAnswer] = useState("");

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
    setAnswer("");
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save your message.");
      setMessage("");
      setNotice("Prompt saved. Asking Gemini…");
      await refresh();
      const aiResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const aiData = await aiResponse.json();
      if (!aiResponse.ok) throw new Error(aiData.error ?? "Gemini could not answer.");
      setAnswer(aiData.answer);
      setNotice("Response received from Google Gemini. The reply is not yet saved to conversation history.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save your message.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><div><strong>COSMOS</strong><small>ALIEN MIND</small></div></div>
        <button className="new-button" onClick={() => { setMessage(""); setNotice("Enter a prompt to start a new saved conversation."); }}>＋ New conversation</button>
        <div className="side-label">MEMORY LOG</div>
        {conversations.length ? conversations.map((item) => (
          <div className="history-item" key={item.id}><span>◌</span><div><strong>{item.title}</strong><small>{item.message_count} saved message{item.message_count === 1 ? "" : "s"}</small></div></div>
        )) : <p className="empty-history">Your saved conversations will appear here.</p>}
        <div className="sidebar-foot"><span className="status-dot" /> Private server-side connection<br /><span className="muted">Database status: {status}</span></div>
      </aside>
      <section className="main-panel">
        <header className="topbar"><div className="breadcrumb">COSMOS <span>/</span> CONTROL CORE</div><div className="topbar-actions"><a className="reference-nav" href="/references">⌕ Reference Center <span>↗</span></a><div className="system-pill"><span className="status-dot" /> {status}</div></div></header>
        <div className="hero">
          <div className="eyebrow"><span /> PERSONAL INTELLIGENCE SYSTEM</div>
          <div className="planet-wrap" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="planet"><div className="planet-shadow" /><div className="planet-glow" /></div><div className="satellite">✧</div></div>
          <h1>Think beyond<br /><em>the known.</em></h1>
          <p className="intro">Your Cosmos workspace is taking shape. Start a thought, save it to long-term storage, and connect live intelligence next.</p>
          <div className="capabilities"><div><span className="cap-icon">◈</span><strong>Neon memory</strong><small>Database connection status</small></div><div><span className="cap-icon">⌘</span><strong>Control core</strong><small>Server-side API foundation</small></div><div><span className="cap-icon">✧</span><strong>AI inference</strong><small>Provider connection pending</small></div></div>
          <form className="prompt-box" onSubmit={submit}><label htmlFor="prompt">WHAT&apos;S ON YOUR MIND?</label><textarea id="prompt" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask Cosmos, capture an idea, or start a mission…" maxLength={20000} rows={3} /><div className="prompt-footer"><span>{message.length.toLocaleString()} / 20,000</span><button type="submit" disabled={saving || !message.trim()}>{saving ? "Saving…" : "Save to Cosmos  ↗"}</button></div></form>
          {notice && <p className="notice" role="status">{notice}</p>}
          {answer && <section className="answer-card" aria-live="polite"><div className="answer-heading"><span>✧</span> COSMOS · GEMINI RESPONSE</div><div className="answer-content">{answer}</div></section>}
          <div className="disclaimer">Honest status: prompts are saved to Neon when configured. Gemini replies require GEMINI_API_KEY in the server environment. AI suggestions do not authorize external actions.</div>
        </div>
        <footer className="footer"><span>ALIEN MIND · MVP</span><span>OBSERVE · VERIFY · EVOLVE</span></footer>
      </section>
    </main>
  );
}
