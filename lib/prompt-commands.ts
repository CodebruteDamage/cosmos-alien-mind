export type ExecutionPolicy = "read_only" | "draft_only" | "approval_required";

export type PromptCommand = {
  command: string;
  category: string;
  description: string;
  example: string;
  keywords: string[];
  workflow: string[];
  executionPolicy: ExecutionPolicy;
};

export const PROMPT_COMMANDS: PromptCommand[] = [
  { command: "/deep-research", category: "KNOW", description: "Research a topic across multiple sources and produce structured findings.", example: "Research current trends in AI operations and provide a sourced report.", keywords: ["deep research", "multiple sources", "literature review", "in depth research", "sourced report"], workflow: ["Clarify research question and scope", "Identify credible sources", "Extract and compare evidence", "Separate facts from inference", "Deliver a cited synthesis"], executionPolicy: "read_only" },
  { command: "/analysis", category: "THINK", description: "Analyze information, data, or documents and identify key findings, risks, and gaps.", example: "Analyze this system report and identify the highest-priority gaps.", keywords: ["analyze", "analysis", "findings", "risks", "data review", "gap analysis"], workflow: ["Define the decision or question", "Inspect supplied evidence", "Identify patterns, risks, and gaps", "State confidence and uncertainty", "Recommend next actions"], executionPolicy: "read_only" },
  { command: "/plan", category: "PLAN", description: "Create a structured strategy, milestone plan, and dependency map.", example: "Create a phased implementation plan for the integration.", keywords: ["plan", "strategy", "roadmap", "milestones", "step by step"], workflow: ["Define outcome and constraints", "Decompose work into milestones", "Map dependencies and owners", "Set acceptance criteria", "Identify approval gates"], executionPolicy: "draft_only" },
  { command: "/create", category: "CREATE", description: "Create a structured artifact such as a report, template, specification, or presentation outline.", example: "Create a technical proposal for the automation service.", keywords: ["create", "generate", "proposal", "template", "report", "presentation"], workflow: ["Confirm artifact purpose and audience", "Select an appropriate structure", "Draft the artifact", "Check completeness and consistency", "Return an editable result"], executionPolicy: "draft_only" },
  { command: "/code", category: "ENGINEERING", description: "Write, explain, debug, or improve code against explicit requirements.", example: "Review this TypeScript route and fix its validation errors.", keywords: ["code", "coding", "debug", "typescript", "python", "script", "compile error", "bug"], workflow: ["Inspect the existing implementation", "Reproduce or isolate the issue", "Propose the smallest safe change", "Implement with tests", "Report verification and residual risks"], executionPolicy: "approval_required" },
  { command: "/think", category: "THINK", description: "Explore alternatives, assumptions, trade-offs, and strategic options.", example: "Explore three viable architectures and compare their trade-offs.", keywords: ["think", "brainstorm", "ideas", "perspectives", "trade offs", "alternatives"], workflow: ["Restate the decision", "Surface assumptions", "Generate distinct options", "Compare trade-offs", "Recommend a direction with confidence"], executionPolicy: "read_only" },
  { command: "/write", category: "CREATE", description: "Draft or refine clear, persuasive, audience-appropriate writing.", example: "Rewrite this update for a technical leadership audience.", keywords: ["write", "rewrite", "polish", "email", "copywriting", "wording", "draft"], workflow: ["Identify audience and purpose", "Preserve required facts", "Draft in the requested tone", "Check clarity and accuracy", "Return the complete draft"], executionPolicy: "draft_only" },
  { command: "/research", category: "KNOW", description: "Find and summarize current information about a topic.", example: "Research current options for secure AI workflow orchestration.", keywords: ["research", "latest information", "current options", "find information", "sources"], workflow: ["Define topic and freshness needs", "Search relevant sources", "Evaluate source quality", "Synthesize key points", "Cite supporting sources"], executionPolicy: "read_only" },
  { command: "/audience", category: "INTELLIGENCE", description: "Understand a target audience and tailor messaging or content to its needs.", example: "Describe the target SMB audience and propose content themes.", keywords: ["audience", "target users", "customer segment", "persona", "market segment"], workflow: ["Define product and market context", "Identify audience segments", "Map needs and objections", "Tailor messaging", "List assumptions requiring validation"], executionPolicy: "read_only" },
  { command: "/document", category: "KNOW", description: "Extract, summarize, and organize information from supplied documents.", example: "Summarize this specification and list its acceptance criteria.", keywords: ["document", "pdf", "summarize file", "extract", "key takeaways", "specification"], workflow: ["Inspect the supplied document", "Extract relevant content", "Preserve source terminology", "Organize findings and gaps", "Cite source locations when available"], executionPolicy: "read_only" },
  { command: "/compare", category: "INTELLIGENCE", description: "Compare options using explicit criteria and evidence.", example: "Compare these architecture options for cost, risk, and maintainability.", keywords: ["compare", "comparison", "versus", "vs", "which is better", "tradeoff"], workflow: ["Identify options", "Define comparison criteria", "Gather comparable evidence", "Score trade-offs transparently", "Recommend based on stated priorities"], executionPolicy: "read_only" },
  { command: "/improve", category: "OPTIMIZATION", description: "Improve an existing artifact or process while preserving its working behavior.", example: "Improve this workflow without breaking existing integrations.", keywords: ["improve", "enhance", "refine", "fix existing", "make better"], workflow: ["Inspect the current baseline", "Identify measurable deficiencies", "Preserve working behavior", "Apply bounded improvements", "Validate against acceptance criteria"], executionPolicy: "approval_required" },
  { command: "/automate", category: "AUTONOMY", description: "Design a repeatable workflow and identify safe automation boundaries.", example: "Design a workflow to triage incoming support requests.", keywords: ["automate", "automation", "workflow", "repetitive task", "trigger", "schedule"], workflow: ["Map the current process", "Identify triggers and actions", "Define permissions and data boundaries", "Add approval and failure handling", "Specify monitoring and rollback"], executionPolicy: "approval_required" },
  { command: "/build", category: "ENGINEERING", description: "Plan and implement an application, tool, or system from verified requirements.", example: "Build a small internal dashboard from this approved specification.", keywords: ["build", "implement", "integration", "provision", "develop", "application", "system"], workflow: ["Inspect repository and runtime", "Confirm scope and restore point", "Design modular implementation", "Implement in an isolated branch", "Run tests and security checks", "Submit evidence for review"], executionPolicy: "approval_required" },
  { command: "/optimize", category: "OPTIMIZATION", description: "Improve performance, reliability, cost, or efficiency using measurable baselines.", example: "Optimize this API after measuring its latency and failure rate.", keywords: ["optimize", "performance", "latency", "efficiency", "cost reduction", "throughput"], workflow: ["Capture baseline metrics", "Identify bottlenecks", "Prioritize by impact and risk", "Apply a measured change", "Compare results against baseline"], executionPolicy: "approval_required" },
  { command: "/action-plan", category: "PLAN", description: "Turn an objective into sequenced actions, owners, and timelines.", example: "Create a 7-day action plan for the approved launch.", keywords: ["action plan", "next steps", "timeline", "execution plan", "tasks"], workflow: ["Define the objective", "Sequence actionable tasks", "Identify dependencies and owners", "Set checkpoints and deadlines", "Define completion evidence"], executionPolicy: "draft_only" },
];

export function recommendPromptCommand(prompt: string) {
  const normalized = prompt.trim().toLowerCase();
  const explicit = normalized.match(/^\/([a-z-]+)(?:\s|$)/);
  if (explicit) {
    const command = PROMPT_COMMANDS.find((item) => item.command === `/${explicit[1]}`);
    return command ? { status: "matched" as const, command, alternatives: [] } : { status: "unknown_command" as const, command: null, alternatives: [] };
  }

  const ranked = PROMPT_COMMANDS.map((command) => ({
    command,
    score: command.keywords.reduce((score, keyword) => score + (normalized.includes(keyword) ? Math.max(1, keyword.split(" ").length) : 0), 0),
  })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

  if (!ranked.length || (ranked.length > 1 && ranked[0].score === ranked[1].score)) {
    return { status: "needs_clarification" as const, command: null, alternatives: ranked.slice(0, 3).map((item) => item.command) };
  }

  return { status: "recommended" as const, command: ranked[0].command, alternatives: ranked.slice(1, 3).map((item) => item.command) };
}
