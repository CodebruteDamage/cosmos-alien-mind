export interface DualCoreProviderResult {
  text: string;
  decision: string;
  model?: string | null;
}
export interface DualCoreProviderContext {
  signal: AbortSignal;
  role: "cosmos-core" | "alien-mind";
}
export interface DualCoreResult {
  ok: boolean;
  status: "aligned" | "needs_review";
  reason: string;
  startedAt: string;
  completedAt: string;
  core: DualCoreProviderResult | { text: null; decision: null; error: string } | null;
  alien: DualCoreProviderResult | { text: null; decision: null; error: string } | null;
  governance: {
    executionPerformed: false;
    permissionsGranted: false;
    humanReviewRequired: boolean;
    alignmentIsNotAuthorization: true;
  };
}
export function runDualCoreTurn(options: {
  prompt: string;
  coreProvider: (prompt: string, context: DualCoreProviderContext) => Promise<DualCoreProviderResult>;
  alienProvider: (prompt: string, context: DualCoreProviderContext) => Promise<DualCoreProviderResult>;
  timeoutMs?: number;
}): Promise<DualCoreResult>;
