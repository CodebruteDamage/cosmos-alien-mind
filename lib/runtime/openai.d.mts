export function createOpenAIProvider(options?: {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): (prompt: string) => Promise<{ text: string; model: string; responseId: string | null }>;