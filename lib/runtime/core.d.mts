export type RuntimeProviderResult = { text: string; model?: string; responseId?: string | null };
export type RuntimeProvider = (prompt: string) => Promise<RuntimeProviderResult>;
export type RuntimeLifecycleEvent = { stage: string; status: string; at: string; [key: string]: unknown };
export function runAssistantTurn(input: {
  prompt: string;
  provider: RuntimeProvider;
  now?: () => Date;
}): Promise<{
  ok: true;
  task: { type: "assistant.respond"; status: "completed" };
  answer: string;
  evidence: {
    provider: string;
    model?: string;
    responseId: string | null;
    startedAt: string;
    completedAt: string;
    lifecycle: RuntimeLifecycleEvent[];
    sideEffects: unknown[];
    toolExecution: false;
    persistence: false;
  };
}>;