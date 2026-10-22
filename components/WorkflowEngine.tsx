"use client";

import { useMemo, useState } from "react";

type NodeStatus = "pending" | "ready" | "running" | "waiting_approval" | "succeeded" | "failed" | "blocked";
type WorkflowNode = { id: string; title: string; detail: string; deps: string[]; status: NodeStatus; gate?: boolean };
type WorkflowEvent = { id: number; at: string; node: string; message: string; kind: "info" | "success" | "warning" };

const initialNodes: WorkflowNode[] = [
  { id: "intake", title: "Intake & scope", detail: "Define Windows 11 x64 target and deployment boundary.", deps: [], status: "succeeded" },
  { id: "installer", title: "Verify installer", detail: "Check Authenticode signature and publisher evidence.", deps: ["intake"], status: "succeeded" },
  { id: "usb", title: "Identify USB", detail: "Match SanDisk Ultra, Disk 5, E:, 28.64 GB.", deps: ["installer"], status: "succeeded" },
  { id: "write", title: "Create installation media", detail: "Media Creation Tool was last observed at 80%. Completion must be observed.", deps: ["usb"], status: "running", gate: true },
  { id: "verify", title: "Verify media", detail: "Inspect setup files and boot structure after the tool completes.", deps: ["write"], status: "blocked" },
  { id: "eject", title: "Safely eject USB", detail: "Eject only after media verification.", deps: ["verify"], status: "blocked" },
  { id: "install", title: "Install on Acer", detail: "Separate home operation; protect internal drive and user data.", deps: ["eject"], status: "blocked", gate: true },
];

const statusLabels: Record<NodeStatus, string> = {
  pending: "Pending", ready: "Ready", running: "Running (reported)", waiting_approval: "Approval required",
  succeeded: "Verified", failed: "Failed", blocked: "Blocked by dependency",
};

export default function WorkflowEngine() {
  const [nodes, setNodes] = useState(initialNodes);
  const [selected, setSelected] = useState("write");
  const [events, setEvents] = useState<WorkflowEvent[]>([
    { id: 1, at: "Latest shared evidence", node: "Create installation media", message: "Screenshot showed 80% progress; no completion evidence received.", kind: "warning" },
    { id: 2, at: "Earlier evidence", node: "Identify USB", message: "Disk Management showed SanDisk Ultra as Disk 5 / E: / 28.64 GB.", kind: "success" },
    { id: 3, at: "Earlier evidence", node: "Verify installer", message: "PowerShell output showed Microsoft Authenticode status Valid.", kind: "success" },
  ]);
  const [showEdges, setShowEdges] = useState(true);
  const [gateNote, setGateNote] = useState("");

  const selectedNode = nodes.find((node) => node.id === selected) ?? nodes[0];
  const verifiedCount = nodes.filter((node) => node.status === "succeeded").length;
  const waitingCount = nodes.filter((node) => node.status === "waiting_approval").length;
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  function addEvent(node: WorkflowNode, message: string, kind: WorkflowEvent["kind"]) {
    setEvents((current) => [{ id: Date.now(), at: new Date().toLocaleTimeString(), node: node.title, message, kind }, ...current].slice(0, 20));
  }

  function requestGate() {
    if (!selectedNode.gate) {
      setGateNote("This node has no approval gate configured.");
      return;
    }
    setNodes((current) => current.map((node) => node.id === selected ? { ...node, status: "waiting_approval" } : node));
    setGateNote("Approval gate displayed in this prototype only. No device action was executed.");
    addEvent(selectedNode, "Approval requested in UI; no external action executed.", "warning");
  }

  function resetDemo() {
    setNodes(initialNodes);
    setSelected("write");
    setGateNote("Demo state reset. Workflow events are illustrative UI events, not a persistent execution log.");
    setEvents([{ id: Date.now(), at: new Date().toLocaleTimeString(), node: "Workflow Engine", message: "Local prototype state reset.", kind: "info" }]);
  }

  return (
    <div className="workflow-page">
      <div className="workflow-heading">
        <div>
          <div className="eyebrow"><span /> WARP GATE · DEPENDENCY GRAPH</div>
          <h2>Workflow <em>Engine</em></h2>
          <p>Inspect pipeline dependencies, node status, evidence, and approval gates.</p>
        </div>
        <span className="workflow-mode">PROTOTYPE · NO LIVE EXECUTOR</span>
      </div>

      <div className="workflow-metrics">
        <div className="workflow-metric"><small>NODES VERIFIED</small><strong>{verifiedCount} / {nodes.length}</strong></div>
        <div className="workflow-metric"><small>APPROVAL GATES WAITING</small><strong>{waitingCount}</strong></div>
        <div className="workflow-metric"><small>EVENTS IN VIEW</small><strong>{events.length}</strong></div>
      </div>

      <div className="workflow-layout">
        <section className="workflow-card">
          <div className="workflow-card-head">
            <div><h3>Windows 11 USB deployment</h3><p>Shop PC → USB → Acer Predator PH315-53</p></div>
            <label className="edge-toggle"><input type="checkbox" checked={showEdges} onChange={(event) => setShowEdges(event.target.checked)} /> Dependencies</label>
          </div>
          <div className="workflow-nodes">
            {nodes.map((node, index) => (
              <div className="workflow-node-wrap" key={node.id}>
                <button type="button" className={`workflow-node ${selected === node.id ? "selected" : ""}`} onClick={() => { setSelected(node.id); setGateNote(""); }}>
                  <span className={`node-index status-${node.status}`}>{node.status === "succeeded" ? "✓" : node.gate ? "◇" : String(index + 1).padStart(2, "0")}</span>
                  <span className="node-copy"><strong>{node.title}</strong><small>{node.detail}</small></span>
                  <span className={`node-status status-text-${node.status}`}>{statusLabels[node.status]}</span>
                </button>
                {showEdges && index < nodes.length - 1 && (
                  <div className="workflow-edge" aria-label={`Dependency from ${node.title} to ${nodes[index + 1].title}`}>
                    <span />
                    <small>{nodes[index + 1].deps.map((dep) => nodeById.get(dep)?.title ?? dep).join(", ")}</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="workflow-side">
          <section className="workflow-card inspector">
            <div className="workflow-card-head"><div><h3>Node inspector</h3><p>Selected node details</p></div></div>
            <span className={`inspector-status status-text-${selectedNode.status}`}>{statusLabels[selectedNode.status]}</span>
            <h4>{selectedNode.title}</h4>
            <p>{selectedNode.detail}</p>
            <div className="inspector-label">DEPENDENCIES</div>
            {selectedNode.deps.length ? selectedNode.deps.map((dep) => <div className="dependency-chip" key={dep}>{nodeById.get(dep)?.title ?? dep} · {statusLabels[nodeById.get(dep)?.status ?? "pending"]}</div>) : <div className="dependency-chip">No upstream dependencies</div>}
            {selectedNode.gate && <div className="gate-panel"><strong><span>◆</span> Warp Gate checkpoint</strong><p>This node can affect external data or hardware. A connected executor must independently enforce approval before acting.</p><button type="button" onClick={requestGate}>Request approval checkpoint</button></div>}
            {gateNote && <p className="workflow-notice" role="status">{gateNote}</p>}
            <button type="button" className="reset-workflow" onClick={resetDemo}>Reset prototype view</button>
          </section>

          <section className="workflow-card event-card">
            <div className="workflow-card-head"><div><h3>Event log</h3><p>Newest first · local prototype state</p></div></div>
            <div className="workflow-events">
              {events.map((event) => <article className="workflow-event" key={event.id}>
                <span className={`event-dot event-${event.kind}`} />
                <div><strong>{event.node}</strong><p>{event.message}</p><small>{event.at}</small></div>
              </article>)}
            </div>
          </section>
        </aside>
      </div>
      <p className="workflow-disclaimer">Evidence-backed snapshot: installer signature and USB identity were observed in user-provided output. Media creation was last observed at 80%; this UI does not poll the shop PC, persist events, or execute system actions.</p>
    </div>
  );
}
