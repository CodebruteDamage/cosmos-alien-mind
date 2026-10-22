"use client";

import { useEffect, useState } from "react";

type NodeRecord = {
  node_id: string;
  display_name: string;
  runtime: "local-pc" | "web" | "mobile" | "service";
  status: "online" | "degraded" | "offline";
  version: string | null;
  last_seen_at: string;
  seconds_since_seen: number;
};

export default function NodeSwarm() {
  const [nodes, setNodes] = useState<NodeRecord[]>([]);
  const [connection, setConnection] = useState<"connecting" | "live" | "retrying">("connecting");
  const [lastUpdate, setLastUpdate] = useState<string>("—");
  const [error, setError] = useState("");

  useEffect(() => {
    let source: EventSource | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      source = new EventSource("/api/nodes/stream");
      source.addEventListener("ready", () => setConnection("live"));
      source.addEventListener("nodes", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as { nodes: NodeRecord[] };
          setNodes(payload.nodes ?? []);
          setLastUpdate(new Date().toLocaleTimeString());
          setError("");
          setConnection("live");
        } catch {
          setError("Invalid node update received.");
        }
      });
      source.addEventListener("status", (event) => {
        const payload = JSON.parse((event as MessageEvent).data) as { error?: string };
        setError(payload.error ?? "Sync status unavailable.");
      });
      source.onerror = () => {
        setConnection("retrying");
        source?.close();
        retryTimer = setTimeout(connect, 3000);
      };
    };
    connect();
    return () => {
      stopped = true;
      source?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  const online = nodes.filter((node) => node.status === "online" && node.seconds_since_seen < 45).length;
  const stale = nodes.filter((node) => node.seconds_since_seen >= 45).length;
  return (
    <section className="swarm-panel" aria-labelledby="swarm-title">
      <div className="swarm-heading">
        <div><div className="swarm-kicker">HYBRID RUNTIME · MICRO-SYNC</div><h2 id="swarm-title">Live data swarm</h2></div>
        <span className={`swarm-connection ${connection}`}><i />{connection === "live" ? "STREAM CONNECTED" : connection === "retrying" ? "RECONNECTING" : "CONNECTING"}</span>
      </div>
      <div className="swarm-stats">
        <div><small>REGISTERED NODES</small><strong>{nodes.length}</strong></div>
        <div><small>FRESH HEARTBEATS</small><strong>{online}</strong></div>
        <div><small>STALE / OFFLINE</small><strong>{stale}</strong></div>
      </div>
      {error && <p className="swarm-error" role="status">{error}</p>}
      {nodes.length === 0 ? <div className="swarm-empty"><span className="swarm-pulse" />Waiting for authenticated node heartbeats. Connect a runtime to populate the swarm.</div> :
        <div className="swarm-nodes">{nodes.map((node) => {
          const fresh = node.seconds_since_seen < 45;
          return <article className="swarm-node" key={node.node_id}>
            <span className={`node-indicator ${fresh && node.status === "online" ? "online" : "offline"}`} />
            <div className="node-main"><strong>{node.display_name}</strong><small>{node.runtime} · {node.version ?? "version unknown"}</small></div>
            <div className="node-state"><strong>{fresh ? node.status : "stale"}</strong><small>{node.seconds_since_seen}s ago</small></div>
          </article>;
        })}</div>}
      <div className="swarm-foot"><span>Incremental server-sent events</span><span>Last change: {lastUpdate}</span></div>
    </section>
  );
}
