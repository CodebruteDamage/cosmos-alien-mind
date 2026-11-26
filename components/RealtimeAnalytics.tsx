"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type TimelinePoint = { bucket: string; total: number; errors: number; security: number };
type EventType = { event_type: string; count: number };
type NodeCount = { node_id: string; count: number };
type AnalyticsPayload = {
  ok: true; source: string; generatedAt: string; windowMinutes: number; limit: number;
  summary: { total_events: number; active_nodes: number; error_events: number; security_events: number };
  eventTypes: EventType[]; nodes: NodeCount[]; timeline: TimelinePoint[];
  latestSeq: number; latestEventAt: string | null; freshness: string;
};
type Props = { enabled: boolean; token: string };

function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : 0; }
function compactTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function buildPoints(data: TimelinePoint[], key: "total" | "errors" | "security") {
  if (!data.length) return "";
  const values = data.map((item) => number(item[key]));
  const max = Math.max(1, ...values);
  const width = 720; const height = 190; const padX = 12; const padY = 16;
  return values.map((value, index) => {
    const x = padX + (values.length === 1 ? width / 2 : index * (width - padX * 2) / (values.length - 1));
    const y = height - padY - (value / max) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}
function pathArea(points: string) {
  if (!points) return "";
  const pairs = points.split(" ");
  return `M ${pairs[0]} L ${pairs.slice(1).join(" L ")} L 708,190 L 12,190 Z`;
}

export default function RealtimeAnalytics({ enabled, token }: Props) {
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "live" | "error">("idle");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!enabled || !token) { setPayload(null); setState("idle"); return; }
    setState((current) => current === "live" ? current : "loading");
    try {
      const response = await fetch(`/api/analytics?window=${windowMinutes}&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal,
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Analytics query failed.");
      setPayload(data as AnalyticsPayload);
      setError("");
      setState("live");
      setUpdatedAt(new Date().toISOString());
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Analytics query failed.");
      setState("error");
    }
  }, [enabled, token, windowMinutes]);

  useEffect(() => {
    if (!enabled || !token) { setPayload(null); setState("idle"); return; }
    const controller = new AbortController();
    void load(controller.signal);
    const timer = setInterval(() => { void load(); }, 10000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [enabled, token, load]);

  const totalPoints = useMemo(() => payload ? buildPoints(payload.timeline, "total") : "", [payload]);
  const errorPoints = useMemo(() => payload ? buildPoints(payload.timeline, "errors") : "", [payload]);
  const securityPoints = useMemo(() => payload ? buildPoints(payload.timeline, "security") : "", [payload]);
  const maxType = Math.max(1, ...(payload?.eventTypes.map((item) => item.count) ?? [1]));
  const maxNode = Math.max(1, ...(payload?.nodes.map((item) => item.count) ?? [1]));

  return (
    <section className="analytics-shell" aria-labelledby="analytics-title">
      <div className="analytics-head">
        <div>
          <div className="eyebrow"><span /> 03 / REAL-TIME DATA INTELLIGENCE</div>
          <h2 id="analytics-title">Visual analytics <em style={{ color: "#8ee9f1", fontStyle: "normal" }}>observatory</em></h2>
          <p>Event-backed telemetry, workload composition, signal trends and system activity.</p>
          <div className={`analytics-state ${state}`}><i />{state === "live" ? "AUTHENTICATED EVENT DATA" : state === "loading" ? "QUERYING EVENT STORE" : state === "error" ? "DATA SOURCE ERROR" : "WAITING FOR AUTHENTICATED SWARM"}</div>
        </div>
        <div className="analytics-controls">
          <select aria-label="Analytics time window" value={windowMinutes} onChange={(event) => setWindowMinutes(Number(event.target.value))}>
            <option value={15}>Last 15 minutes</option><option value={60}>Last 60 minutes</option><option value={360}>Last 6 hours</option><option value={1440}>Last 24 hours</option>
          </select>
          <button type="button" onClick={() => void load()} disabled={!enabled || state === "loading"}>↻ Refresh</button>
        </div>
      </div>

      {!enabled || !token ? <div className="analytics-empty"><div><strong>Connect the authenticated swarm first</strong>Analytics reads the existing protected event store. No public or unauthenticated telemetry endpoint is used.</div></div> :
        state === "error" && !payload ? <div className="analytics-empty"><div><strong>Analytics source unavailable</strong>{error}<br />Check the swarm token, Neon configuration and additive swarm schema.</div></div> : !payload ? <div className="analytics-empty"><div><strong>Loading event-backed analytics</strong>Waiting for the first authenticated response from the analytics API.</div></div> : <>
          <div className="analytics-metrics">
            <article className="analytics-card"><small>EVENTS IN WINDOW</small><strong>{number(payload.summary.total_events).toLocaleString()}</strong><span>Max {payload.limit} records queried</span><b>◈</b></article>
            <article className="analytics-card"><small>ACTIVE NODES</small><strong>{number(payload.summary.active_nodes).toLocaleString()}</strong><span>Nodes represented in events</span><b>⌘</b></article>
            <article className="analytics-card"><small>ERROR / FAILURE EVENTS</small><strong>{number(payload.summary.error_events).toLocaleString()}</strong><span>Classified by event type</span><b>△</b></article>
            <article className="analytics-card"><small>SECURITY / POLICY EVENTS</small><strong>{number(payload.summary.security_events).toLocaleString()}</strong><span>Classified by event type</span><b>⛨</b></article>
          </div>

          <div className="analytics-grid">
            <article className="analytics-chart">
              <h3>Event activity timeline</h3><div className="chart-sub">Minute buckets · selected time window · event store source</div>
              {payload.timeline.length ? <svg className="analytics-canvas" viewBox="0 0 720 210" role="img" aria-label="Timeline of total, error and security events">
                <defs><linearGradient id="analyticsArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8ee9f1"/><stop offset="100%" stopColor="#8ee9f1" stopOpacity="0"/></linearGradient></defs>
                {[35,85,135,185].map((y) => <line key={y} x1="12" x2="708" y1={y} y2={y} className="analytics-gridline"/>)}
                <path d={pathArea(totalPoints)} className="analytics-area-total"/>
                <polyline points={totalPoints} className="analytics-line-total"/>
                <polyline points={errorPoints} className="analytics-line-errors"/>
                <polyline points={securityPoints} className="analytics-line-security"/>
                <text x="12" y="205" className="analytics-axis">{compactTime(payload.timeline[0].bucket)}</text>
                <text x="708" y="205" textAnchor="end" className="analytics-axis">{compactTime(payload.timeline[payload.timeline.length - 1].bucket)}</text>
              </svg> : <div className="analytics-empty"><div><strong>No events in this time window</strong>Once trusted nodes emit telemetry, the timeline will populate from stored events.</div></div>}
              <div className="analytics-legend"><span><i style={{ background: "#8ee9f1" }}/>Total events</span><span><i style={{ background: "#ff879f" }}/>Errors</span><span><i style={{ background: "#f2c17b" }}/>Security / policy</span></div>
            </article>
            <article className="analytics-chart">
              <h3>Event type distribution</h3><div className="chart-sub">Top event classes · current window</div>
              {payload.eventTypes.length ? <div className="analytics-bars">{payload.eventTypes.map((item) => <div className="analytics-bar-row" key={item.event_type}><span title={item.event_type}>{item.event_type}</span><div className="analytics-bar-track"><span style={{ width: `${Math.max(2, item.count / maxType * 100)}%` }}/></div><strong>{item.count}</strong></div>)}</div> : <div className="analytics-empty"><div><strong>No event classes</strong>No event records were returned for the selected window.</div></div>}
            </article>
          </div>
          <div className="analytics-grid">
            <article className="analytics-chart">
              <h3>Node workload ranking</h3><div className="chart-sub">Event contribution by node</div>
              {payload.nodes.length ? <div className="analytics-bars">{payload.nodes.map((item) => <div className="analytics-bar-row" key={item.node_id}><span title={item.node_id}>{item.node_id}</span><div className="analytics-bar-track"><span style={{ width: `${Math.max(2, item.count / maxNode * 100)}%` }}/></div><strong>{item.count}</strong></div>)}</div> : <div className="analytics-empty"><div><strong>No node activity</strong>Node contribution appears when telemetry is persisted.</div></div>}
            </article>
            <article className="analytics-chart">
              <h3>Data integrity & freshness</h3><div className="chart-sub">Provenance indicators for this query</div>
              <table className="analytics-table"><tbody>
                <tr><th>Source</th><td>Authenticated swarm event store</td></tr>
                <tr><th>Latest sequence</th><td>{payload.latestSeq.toLocaleString()}</td></tr>
                <tr><th>Latest event</th><td>{payload.latestEventAt ? new Date(payload.latestEventAt).toLocaleString() : "None"}</td></tr>
                <tr><th>Generated</th><td>{new Date(payload.generatedAt).toLocaleTimeString()}</td></tr>
                <tr><th>Refresh interval</th><td>10 seconds</td></tr>
                <tr><th>Data status</th><td>{payload.freshness}</td></tr>
              </tbody></table>
              {error && <p className="analytics-disclaimer">Latest refresh warning: {error}. Displaying the last successful snapshot.</p>}
            </article>
          </div>
          <div className="analytics-foot"><span>Last successful refresh: {updatedAt ? new Date(updatedAt).toLocaleTimeString() : "—"}</span><span>Server time: {new Date(payload.generatedAt).toLocaleString()}</span></div>
        </>}
      <p className="analytics-disclaimer">Metrics are calculated from stored swarm events. Error and security categories use event-type naming conventions; they are indicators, not a security verdict. No telemetry is invented by this module.</p>
    </section>
  );
}
