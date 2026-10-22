"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Conversation = { id: string; title: string; created_at: string; updated_at: string; message_count: number };
type SwarmNode = { nodeId: string; status: "online" | "degraded" | "offline"; metadata?: Record<string, unknown>; lastSeenAt: string; ageSeconds: number };
type SwarmEvent = { seq: number; event_id: string; node_id: string; event_type: string; payload: Record<string, unknown>; created_at: string };
type SwarmState = "disconnected" | "connecting" | "connected" | "error";
const POLL_MS = 5000;

function timeLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown time" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function ageLabel(seconds: number) {
  if (seconds < 2) return "just now";
  if (seconds < 60) return Math.floor(seconds) + "s ago";
  return Math.floor(seconds / 60) + "m ago";
}
function statusLabel(status: SwarmNode["status"]) {
  return status === "online" ? "ONLINE" : status === "degraded" ? "DEGRADED" : "OFFLINE";
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [status, setStatus] = useState("Checking backend…");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [swarmToken, setSwarmToken] = useState("");
  const [swarmState, setSwarmState] = useState<SwarmState>("disconnected");
  const [swarmMessage, setSwarmMessage] = useState("Connect with your swarm operator token to load live nodes.");
  const [nodes, setNodes] = useState<SwarmNode[]>([]);
  const [events, setEvents] = useState<SwarmEvent[]>([]);
  const [cursor, setCursor] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const cursorRef = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const pair = await Promise.all([
        fetch("/api/health", { cache: "no-store" }),
        fetch("/api/conversations", { cache: "no-store" }),
      ]);
      const healthData = await pair[0].json();
      setStatus(healthData.database === "connected" ? "Neon connected" : healthData.database === "not_configured" ? "Neon setup required" : "Backend needs attention");
      if (pair[1].ok) {
        const data = await pair[1].json();
        setConversations(data.conversations ?? []);
      }
    } catch { setStatus("Backend unreachable"); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const disconnectSwarm = useCallback((messageText = "Disconnected from the live swarm.") => {
    setSwarmToken("");
    setSimulationMode(false);
    setTokenDraft("");
    setSwarmState("disconnected");
    setSwarmMessage(messageText);
    setNodes([]);
    setEvents([]);
    setCursor(0);
    cursorRef.current = 0;
    setLastSync(null);
  }, []);

  async function connectSwarm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = tokenDraft.trim();
    if (candidate.length < 32) {
      setSwarmState("error");
      setSwarmMessage("Token must contain at least 32 characters.");
      return;
    }
    setSwarmState("connecting");
    setSwarmMessage("Authenticating and loading the latest node snapshot…");
    try {
      const response = await fetch("/api/swarm", { headers: { Authorization: "Bearer " + candidate }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not connect to the swarm.");
      if (data.mode !== "snapshot" || !Array.isArray(data.nodes)) throw new Error("Unexpected snapshot response.");
      cursorRef.current = Number(data.cursor ?? 0);
      setCursor(cursorRef.current);
      setNodes(data.nodes);
      setEvents([]);
      setSwarmToken(candidate);
      setTokenDraft("");
      setSwarmState("connected");
      setSwarmMessage("Authenticated. Live node health and event replay are active.");
      setLastSync(new Date().toISOString());
    } catch (error) {
      setSwarmState("error");
      setSwarmMessage(error instanceof Error ? error.message : "Swarm connection failed.");
    }
  }

  useEffect(() => {
    if (!swarmToken || swarmState !== "connected") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const response = await fetch("/api/swarm?after=" + cursorRef.current + "&limit=100", {
          headers: { Authorization: "Bearer " + swarmToken }, cache: "no-store",
        });
        if (!response.ok) {
          if (response.status === 401) {
            disconnectSwarm("Authentication expired or rejected. Reconnect with a valid operator token.");
            return;
          }
          throw new Error(response.status === 503 ? "Swarm service or database is not configured." : "Live sync request failed.");
        }
        const data = await response.json();
        if (cancelled) return;
        if (data.mode !== "events" || !Array.isArray(data.events)) throw new Error("Unexpected replay response.");
        if (data.events.length) {
          setEvents((previous) => [...previous, ...data.events].slice(-80));
          cursorRef.current = Number(data.cursor ?? cursorRef.current);
          setCursor(cursorRef.current);
        }
        // Refresh server-computed heartbeat freshness every cycle, even when no events arrive.
        const snapshotResponse = await fetch("/api/swarm", { headers: { Authorization: "Bearer " + swarmToken }, cache: "no-store" });
        if (snapshotResponse.ok) {
          const snapshot = await snapshotResponse.json();
          if (!cancelled && Array.isArray(snapshot.nodes)) setNodes(snapshot.nodes);
        }
        setLastSync(new Date().toISOString());
        setSwarmMessage("Authenticated. Live node health and event replay are active.");
        if (data.hasMore) { timer = setTimeout(poll, 0); return; }
      } catch (error) {
        if (!cancelled) setSwarmMessage((error instanceof Error ? error.message : "Live sync interrupted.") + " Retrying automatically…");
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS);
    };
    timer = setTimeout(poll, POLL_MS);
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [swarmToken, swarmState, disconnectSwarm]);


  function runLocalSimulation() {
    // Synthetic fixtures stay entirely in browser memory; no API call or database write.
    const now = Date.now();
    const iso = (secondsAgo: number) => new Date(now - secondsAgo * 1000).toISOString();
    const simulatedNodes: SwarmNode[] = [
      { nodeId: "SIM-LOCAL-CORE", status: "online", metadata: { platform: "Windows / Local runtime", version: "sim-1.0" }, lastSeenAt: iso(4), ageSeconds: 4 },
      { nodeId: "SIM-NEON-RELAY", status: "degraded", metadata: { platform: "Cloud relay", version: "sim-1.0" }, lastSeenAt: iso(48), ageSeconds: 48 },
      { nodeId: "SIM-EDGE-NODE-03", status: "offline", metadata: { platform: "Edge device", version: "sim-1.0" }, lastSeenAt: iso(140), ageSeconds: 140 },
    ];
    const simulatedEvents: SwarmEvent[] = [
      { seq: 101, event_id: "sim-evt-101", node_id: "SIM-LOCAL-CORE", event_type: "heartbeat.accepted", payload: { simulated: true }, created_at: iso(3) },
      { seq: 102, event_id: "sim-evt-102", node_id: "SIM-NEON-RELAY", event_type: "heartbeat.stale", payload: { ageSeconds: 48, simulated: true }, created_at: iso(7) },
      { seq: 103, event_id: "sim-evt-103", node_id: "SIM-EDGE-NODE-03", event_type: "node.offline", payload: { ageSeconds: 140, simulated: true }, created_at: iso(11) },
      { seq: 104, event_id: "sim-evt-104", node_id: "SIM-LOCAL-CORE", event_type: "telemetry.signal", payload: { signal: "JEV_MATRIX_PULSE", simulated: true }, created_at: iso(1) },
    ];
    cursorRef.current = 104;
    setCursor(104);
    setNodes(simulatedNodes);
    setEvents(simulatedEvents);
    setSwarmToken("");
    setTokenDraft("");
    setSwarmState("disconnected");
    setSimulationMode(true);
    setLastSync(new Date(now).toISOString());
    setSwarmMessage("Local simulation active. Synthetic fixtures only; no server request was sent.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save your message.");
      setMessage("");
      setNotice("Saved to Neon. AI inference is not connected yet.");
      await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save your message."); }
    finally { setSaving(false); }
  }

  const onlineCount = nodes.filter((node) => node.status === "online").length;
  const degradedCount = nodes.filter((node) => node.status === "degraded").length;
  const offlineCount = nodes.filter((node) => node.status === "offline").length;
  const dataVisible = swarmState === "connected" || simulationMode;

  // Data-derived JEV Matrix reacts when node health, telemetry, or replay cursor changes.
  const matrixCells = Array.from({ length: 96 }, (_, index) => {
    const node = nodes.length ? nodes[index % nodes.length] : undefined;
    const event = events.length ? events[(index * 7 + cursor) % events.length] : undefined;
    const active = dataVisible && (index < nodes.length * 4 || index < events.length * 2);
    const level = !active ? 0 : node?.status === "offline" ? 1 : node?.status === "degraded" ? 2 : event ? 4 : 3;
    return { index, level, active, nodeId: node?.nodeId, eventType: event?.event_type };
  });

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><div><strong>COSMOS</strong><small>ALIEN MIND · ULTIMATE</small></div></div>
        <button className="new-button" onClick={() => { setMessage(""); setNotice("Enter a prompt to start a new saved conversation."); }}>＋ New conversation</button>
        <div className="side-label">CONTROL DECK</div>
        <a className="nav-item active" href="#overview"><span>◈</span> Overview <small>01</small></a>
        <a className="nav-item" href="#swarm"><span>⌘</span> Live data swarm <small>{swarmState === "connected" ? "LIVE" : "—"}</small></a>
        <a className="nav-item" href="#memory"><span>◌</span> Memory log <small>{conversations.length}</small></a>
        <div className="side-label" id="memory">MEMORY LOG</div>
        {conversations.length ? conversations.map((item) => <div className="history-item" key={item.id}><span>◌</span><div><strong>{item.title}</strong><small>{item.message_count} saved message{item.message_count === 1 ? "" : "s"}</small></div></div>) : <p className="empty-history">Your saved conversations will appear here.</p>}
        <div className="sidebar-foot"><span className="status-dot" /> Server-side storage<br /><span className="muted">Database: {status}</span></div>
      </aside>

      <section className="main-panel">
        <header className="topbar"><div className="breadcrumb">COSMOS <span>/</span> ALIEN MIND <span>/</span> CONTROL CORE</div><div className={"system-pill " + (swarmState === "connected" ? "pill-live" : "")}><span className="status-dot" /> {swarmState === "connected" ? "SWARM LIVE" : status}</div></header>
        <div className="dashboard-content" id="overview">
          <section className="welcome-row"><div><div className="eyebrow"><span /> ALIEN MIND · SYSTEM OVERVIEW</div><h1>Command <em>the unknown.</em></h1><p className="intro">A live operations surface for Cosmos nodes, telemetry, and long-term memory.</p></div><div className="live-clock"><span className={"pulse-ring " + (swarmState === "connected" || simulationMode ? "active" : "")} /><div><strong>{simulationMode ? "SIMULATION ACTIVE" : swarmState === "connected" ? "LIVE SYNC ENABLED" : "LIVE SYNC STANDBY"}</strong><small>{lastSync ? (simulationMode ? "Synthetic data · " : "Last sync ") + timeLabel(lastSync) : "Waiting for secure connection"}</small></div></div></section>

          <section className="metric-grid" aria-label="Swarm summary">
            <article className="metric-card"><div className="metric-label">REGISTERED NODES</div><div className="metric-value">{dataVisible ? nodes.length : "—"}</div><div className="metric-foot">Visible in current snapshot</div><span className="metric-symbol">⌘</span></article>
            <article className="metric-card"><div className="metric-label">ONLINE</div><div className="metric-value success-text">{dataVisible ? onlineCount : "—"}</div><div className="metric-foot">Heartbeat age ≤ 30 sec</div><span className="metric-symbol">◉</span></article>
            <article className="metric-card"><div className="metric-label">DEGRADED</div><div className="metric-value warning-text">{dataVisible ? degradedCount : "—"}</div><div className="metric-foot">Stale or reduced health</div><span className="metric-symbol">△</span></article>
            <article className="metric-card"><div className="metric-label">OFFLINE</div><div className="metric-value danger-text">{dataVisible ? offlineCount : "—"}</div><div className="metric-foot">Heartbeat age &gt; 90 sec</div><span className="metric-symbol">⊘</span></article>
          </section>

          <section className="panel jev-panel" aria-labelledby="jev-title">
            <div className="section-heading">
              <div><div className="eyebrow">00 / REACTIVE SIGNAL FIELD</div><h2 id="jev-title">JEV Matrix <em className="matrix-live-word">autoreact</em></h2><p>Micro-square signals recompute from live node health, telemetry volume, and the event cursor.</p></div>
              <div className={"matrix-state " + (swarmState === "connected" || simulationMode ? "is-live" : "")}><span />{simulationMode ? "SIMULATION DATA" : swarmState === "connected" ? "DATA LINK ACTIVE" : "AWAITING DATA"}</div>
            </div>
            <div className={"jev-matrix " + (swarmState === "connected" || simulationMode ? "matrix-connected" : "")} role="img" aria-label={"JEV Matrix with 96 signal cells; " + onlineCount + " online, " + degradedCount + " degraded, " + offlineCount + " offline nodes"}>
              {matrixCells.map((cell) => <span key={cell.index} className={"matrix-cell level-" + cell.level + (cell.active ? " cell-active" : "")} title={cell.nodeId ? cell.nodeId + (cell.eventType ? " · " + cell.eventType : "") : "Awaiting live telemetry"} />)}
            </div>
            <div className="matrix-actions"><button type="button" className="simulate-button" onClick={runLocalSimulation}>▶ Run local simulation</button>{simulationMode && <button type="button" className="quiet-button" onClick={() => disconnectSwarm("Simulation cleared. Connect to the real service when ready.")}>Clear simulation</button>}<span>Browser-only · no network writes</span></div>
            <div className="matrix-legend"><span><i className="legend-online" />Healthy signal</span><span><i className="legend-degraded" />Degraded signal</span><span><i className="legend-offline" />Offline signal</span><span className="matrix-footnote">{dataVisible ? (simulationMode ? "SIMULATED · " : "") + nodes.length + " nodes · " + events.length + " events · cursor " + cursor : "Preview idle · connect to activate data-driven cells"}</span></div>
          </section>

          <section className="panel swarm-panel" id="swarm">
            <div className="section-heading"><div><div className="eyebrow">01 / DISTRIBUTED RUNTIME</div><h2>Live data swarm</h2><p>Node health, heartbeat freshness, and incremental telemetry.</p></div><div className={"connection-badge " + swarmState}><span />{simulationMode ? "SIMULATION" : swarmState === "connected" ? "CONNECTED" : swarmState === "connecting" ? "CONNECTING" : swarmState === "error" ? "ATTENTION" : "DISCONNECTED"}</div></div>
            {!dataVisible ? <div className="connect-layout"><div className="connect-visual" aria-hidden="true"><div className="radar-grid"><span /><span /><span /><i /><b>✦</b></div></div><div className="connect-copy"><h3>Establish secure uplink</h3><p>Enter your swarm operator token to authenticate with the server-side event API. The token stays in this page's memory and is never saved to local storage.</p><form className="connect-form" onSubmit={connectSwarm}><label htmlFor="swarm-token">OPERATOR BEARER TOKEN</label><input id="swarm-token" type="password" autoComplete="off" value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} placeholder="Paste your 32+ character token" minLength={32} required /><div className="connect-actions"><button type="submit" disabled={swarmState === "connecting" || tokenDraft.trim().length < 32}>{swarmState === "connecting" ? "Connecting…" : "Connect swarm ↗"}</button></div></form><p className={"swarm-message " + (swarmState === "error" ? "error-text" : "")} role="status">{swarmMessage}</p></div></div> : <>
              <div className="swarm-toolbar"><div><span className="status-dot" /> {simulationMode ? "Synthetic local data channel" : "Authenticated service channel"}</div><div>Cursor <strong>{cursor}</strong> · Poll interval <strong>5s</strong></div><button className="quiet-button" onClick={() => disconnectSwarm()}> {simulationMode ? "Clear simulation" : "Disconnect"} </button></div>
              {nodes.length ? <div className="node-grid">{nodes.map((node) => <article className="node-card" key={node.nodeId}><div className="node-card-top"><span className="node-icon">⌘</span><span className={"node-status " + node.status}><i />{statusLabel(node.status)}</span></div><h3>{node.nodeId}</h3><p className="node-meta">{typeof node.metadata?.platform === "string" ? node.metadata.platform : "Runtime node"}{typeof node.metadata?.version === "string" ? " · " + node.metadata.version : ""}</p><div className="heartbeat-line"><span>LAST HEARTBEAT</span><strong>{ageLabel(Number(node.ageSeconds ?? 0))}</strong></div><div className="heartbeat-track"><span className={node.status} /></div><small className="node-timestamp">{timeLabel(node.lastSeenAt)}</small></article>)}</div> : <div className="empty-swarm"><span>⌘</span><strong>No nodes have checked in yet</strong><p>Send a heartbeat from a trusted node agent to populate the live swarm.</p></div>}
            </>}
          </section>

          <section className="lower-grid">
            <section className="panel events-panel"><div className="section-heading compact"><div><div className="eyebrow">02 / EVENT STREAM</div><h2>Telemetry feed</h2></div><span className="feed-count">{events.length} recent</span></div>{!dataVisible ? <div className="feed-empty">Secure connection required to view telemetry.</div> : events.length ? <div className="event-list">{[...events].reverse().map((item) => <article className="event-row" key={item.event_id}><span className="event-marker" /><div className="event-main"><strong>{item.event_type}</strong><small>{item.node_id} · seq {item.seq}</small></div><time>{timeLabel(item.created_at)}</time></article>)}</div> : <div className="feed-empty">Listening for new telemetry events…<small>Reconnect uses the sequence cursor to replay missed events.</small></div>}</section>
            <section className="panel memory-panel"><div className="section-heading compact"><div><div className="eyebrow">03 / LONG-TERM MEMORY</div><h2>Capture a thought</h2></div><span className="memory-glyph">◈</span></div><form className="prompt-box" onSubmit={submit}><label htmlFor="prompt">MISSION NOTE</label><textarea id="prompt" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Capture an idea, decision, or next action…" maxLength={20000} rows={3} /><div className="prompt-footer"><span>{message.length.toLocaleString()} / 20,000</span><button type="submit" disabled={saving || !message.trim()}>{saving ? "Saving…" : "Save to memory ↗"}</button></div></form>{notice && <p className="notice" role="status">{notice}</p>}<p className="disclaimer">Conversation persistence depends on Neon configuration and the existing database schema. AI inference is not connected by this interface.</p></section>
          </section>
          <footer className="footer"><span>ALIEN MIND · ULTIMATE CONTROL SURFACE</span><span>OBSERVE · VERIFY · RECOVER · EVOLVE</span></footer>
        </div>
      </section>
    </main>
  );
}
