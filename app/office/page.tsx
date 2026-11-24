"use client";

import { useMemo, useState } from "react";
import styles from "./office.module.css";

type Module = {
  id: string;
  name: string;
  category: "Workforce" | "Create" | "Operate" | "Engineering";
  symbol: string;
  summary: string;
  description: string;
  capabilities: string[];
  dependencies: string[];
};

const modules: Module[] = [
  { id: "workforce", name: "Workforce", category: "Workforce", symbol: "◉", summary: "Coordinate specialist agents and human operators.", description: "The workforce registry is the directory for people, agents, roles, and assigned missions. Registration does not grant execution authority.", capabilities: ["Agent and human registry", "Role and responsibility mapping", "Mission assignment workspace", "Performance and evidence review"], dependencies: ["Agent Registry", "Identity service", "WARP GATE"] },
  { id: "docs", name: "Docs", category: "Create", symbol: "▤", summary: "Create and maintain operational documents.", description: "A document workspace for briefs, specifications, reports, runbooks, and controlled records.", capabilities: ["Document workspace", "Version and review metadata", "Templates and structured briefs", "Approval-ready handoff"], dependencies: ["File service", "Identity service", "Audit trail"] },
  { id: "slides", name: "Slides", category: "Create", symbol: "▥", summary: "Build presentations from approved content.", description: "A presentation workspace for business proposals, product demos, internal briefings, and status reviews.", capabilities: ["Presentation projects", "Reusable layouts", "Evidence-linked claims", "Export integration (planned)"], dependencies: ["File service", "Docs", "Export adapter"] },
  { id: "design", name: "Design", category: "Create", symbol: "✳", summary: "Manage visual concepts and design assets.", description: "A visual workspace for product concepts, brand assets, interface references, and design reviews.", capabilities: ["Design briefs", "Asset library", "Reference and review records", "Design handoff"], dependencies: ["File service", "Asset storage", "Review workflow"] },
  { id: "sheets", name: "Sheets", category: "Operate", symbol: "▦", summary: "Organize structured data and calculations.", description: "A spreadsheet workspace for operational trackers, budgets, inventories, and structured analysis.", capabilities: ["Tabular datasets", "Formula engine (planned)", "Import and export adapters", "Change history"], dependencies: ["Data service", "File service", "Calculation adapter"] },
  { id: "boards", name: "Boards", category: "Operate", symbol: "▥", summary: "Plan projects, missions, and team work.", description: "A planning surface for tasks, owners, milestones, dependencies, and delivery status.", capabilities: ["Projects and work items", "Owners and due dates", "Status and dependency tracking", "Workforce assignment"], dependencies: ["Workforce", "Identity service", "Event service"] },
  { id: "data", name: "Data", category: "Operate", symbol: "◫", summary: "Explore metrics and operational evidence.", description: "A reporting workspace for verified operational metrics, source-linked analysis, and business dashboards.", capabilities: ["Metric catalog", "Source-linked reports", "Dashboard layouts", "Data quality indicators"], dependencies: ["Data connectors", "Evidence service", "Analytics adapter"] },
  { id: "motion", name: "Motion", category: "Create", symbol: "▶", summary: "Prepare animated explainers and media briefs.", description: "A media workspace for storyboards, explainers, motion briefs, and approved media outputs.", capabilities: ["Storyboard planning", "Scene and asset organization", "Render job tracking", "Media review"], dependencies: ["Asset storage", "Render provider", "Review workflow"] },
  { id: "code", name: "Code", category: "Engineering", symbol: "</>", summary: "Manage software projects and build workflows.", description: "An engineering workspace for repositories, change proposals, build evidence, and release readiness.", capabilities: ["Repository inventory", "Change and review workflow", "Build and test evidence", "Release checklist"], dependencies: ["Git provider", "Build runners", "WARP GATE"] },
  { id: "browser", name: "Browser", category: "Engineering", symbol: "◎", summary: "Coordinate authorized browser-based work.", description: "A browser workspace for approved research and web workflows. External actions require explicit scope and authorization.", capabilities: ["Research sessions", "Approved site scopes", "Task and evidence history", "Human confirmation checkpoints"], dependencies: ["Browser provider", "Scope policy", "WARP GATE"] },
];

const categories = ["All", "Workforce", "Create", "Operate", "Engineering"] as const;
type Category = (typeof categories)[number];

export default function CosmosOfficePage() {
  const [active, setActive] = useState("overview");
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const selected = modules.find((item) => item.id === active);
  const filtered = useMemo(() => modules.filter((item) => (category === "All" || item.category === category) && (item.name + " " + item.summary).toLowerCase().includes(query.toLowerCase())), [category, query]);

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="/"><span className={styles.brandMark}>✦</span><span><strong>COSMOS</strong><small>OFFICE</small></span></a>
        <div className={styles.workspaceLabel}>WORKSPACE</div>
        <button className={active === "overview" ? styles.navActive : styles.navItem} onClick={() => setActive("overview")}><span>⌂</span> Office overview</button>
        <button className={active === "workforce" ? styles.navActive : styles.navItem} onClick={() => setActive("workforce")}><span>◉</span> Workforce</button>
        <div className={styles.workspaceLabel}>APPLICATIONS</div>
        {modules.filter((item) => item.id !== "workforce").map((item) => <button key={item.id} className={active === item.id ? styles.navActive : styles.navItem} onClick={() => setActive(item.id)}><span>{item.symbol}</span>{item.name}</button>)}
        <div className={styles.sidebarFoot}><span className={styles.statusDot} /> Foundation preview <small>UI only · integrations pending</small></div>
      </aside>

      <section className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.crumb}>COSMOS <span>/</span> OFFICE <span>/</span> {selected?.name.toUpperCase() ?? "OVERVIEW"}</div>
          <div className={styles.topActions}><span className={styles.previewTag}>FOUNDATION PREVIEW</span><span className={styles.avatar}>F</span></div>
        </header>

        {selected ? (
          <div className={styles.content}>
            <button className={styles.backLink} onClick={() => setActive("overview")}>← Office overview</button>
            <div className={styles.moduleHero}>
              <div className={styles.moduleSymbol}>{selected.symbol}</div>
              <div><div className={styles.eyebrow}>{selected.category.toUpperCase()} APPLICATION</div><h1>COSMOS {selected.name.toUpperCase()}</h1><p>{selected.description}</p></div>
            </div>
            <div className={styles.statusStrip}><span className={styles.statusDot} /> Interface foundation present <span className={styles.statusDivider}>·</span> Service integration not connected</div>
            <div className={styles.detailGrid}>
              <section className={styles.panel}><div className={styles.panelTitle}>CAPABILITY AREAS</div><div className={styles.capabilityList}>{selected.capabilities.map((cap) => <div key={cap}><span>◇</span>{cap}</div>)}</div></section>
              <section className={styles.panel}><div className={styles.panelTitle}>REQUIRED SERVICES</div><div className={styles.capabilityList}>{selected.dependencies.map((dep) => <div key={dep}><span>⌁</span>{dep}<small>Pending integration</small></div>)}</div></section>
            </div>
            <section className={styles.gatePanel}><div><div className={styles.panelTitle}>WARP GATE · ACCESS POLICY</div><strong>Execution is not enabled from this interface.</strong><p>Module availability is separate from agent clearance. A future action must declare its capability, scope, risk, evidence requirements, and approval path before execution.</p></div><span className={styles.lock}>▣ LOCKED</span></section>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.heroRow}><div><div className={styles.eyebrow}>UNIFIED WORK ENVIRONMENT</div><h1>One office.<br/><em>Modular intelligence.</em></h1><p className={styles.intro}>A shared workspace for people, AI workforce, and specialized applications — governed by one permission and evidence layer.</p></div><div className={styles.orbit}><div className={styles.orbitRing} /><div className={styles.orbitCore}>C</div><span className={styles.orbitDot} /></div></div>
            <div className={styles.metrics}>
              <div><span>APPLICATION MODULES</span><strong>10</strong><small>Registered in foundation catalog</small></div>
              <div><span>CONNECTED SERVICES</span><strong>0</strong><small>Integration status not yet verified</small></div>
              <div><span>EXECUTION AUTHORITY</span><strong>LOCKED</strong><small>Requires WARP GATE policy</small></div>
            </div>
            <div className={styles.sectionHead}><div><div className={styles.eyebrow}>APPLICATION DIRECTORY</div><h2>Office applications</h2></div><input aria-label="Search applications" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search modules…" /></div>
            <div className={styles.filters}>{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? styles.filterActive : styles.filter}>{item}</button>)}</div>
            <div className={styles.moduleGrid}>{filtered.map((item) => <article className={styles.moduleCard} key={item.id}><div className={styles.cardTop}><span className={styles.cardSymbol}>{item.symbol}</span><span className={styles.cardStatus}>FOUNDATION</span></div><h3>COSMOS {item.name.toUpperCase()}</h3><p>{item.summary}</p><button onClick={() => setActive(item.id)}>Open workspace <span>↗</span></button></article>)}</div>
            {filtered.length === 0 && <div className={styles.empty}>No modules match this search.</div>}
            <section className={styles.governance}><div className={styles.governanceIcon}>▣</div><div><div className={styles.eyebrow}>SHARED GOVERNANCE LAYER</div><h2>WARP GATE controls execution.</h2><p>Identity · Capability grants · Scope validation · Human approval · Evidence · Audit trail</p></div><span className={styles.lock}>EXECUTION LOCKED</span></section>
            <footer className={styles.footer}><span>COSMOS OFFICE · FOUNDATION V1.0</span><span>OBSERVE · VERIFY · AUTHORIZE</span></footer>
          </div>
        )}
      </section>
    </main>
  );
}
