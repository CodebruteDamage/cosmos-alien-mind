# COS-ANDROID-005 — Unified Runtime Response Lifecycle

## Objective
Connect the authenticated Termux client to one server-side COSMOS runtime lifecycle and a GPT provider without granting remote shell or tool execution.

## Delivered in this branch
- Provider-neutral lifecycle runner in `lib/runtime/core.mjs`.
- OpenAI Responses API adapter in `lib/runtime/openai.mjs`.
- Authenticated endpoint at `POST /api/runtime/respond`.
- Termux prompt client at `android-bridge/src/assistant.mjs`.
- Lifecycle evidence in the response: intake, authorization, skill selection, execution, verification, and record.
- Native Node test coverage for lifecycle behavior, prompt validation, provider extraction, storage-disabled requests, and absence of shell execution in the mobile client.

## Security boundary
- Reuses the existing server-side bridge bearer authentication.
- OpenAI credentials remain server-side in `OPENAI_API_KEY`.
- OpenAI Responses API requests set `store: false`.
- No model tools, MCP tools, shell commands, file writes, package installs, task queue, or autonomous external actions are enabled.
- Termux client only sends text prompts over HTTPS and prints the JSON response.
- No RAG retrieval or durable runtime audit persistence is claimed in this milestone.

## Configuration
Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in the server-side environment. Keep `BRIDGE_SHARED_SECRET` server-side and provision the matching token securely in Termux. Never commit or paste either secret.

From the repository root in Termux:
```bash
node android-bridge/src/assistant.mjs "Summarize the COSMOS runtime status"
```

## Validation
Run:
```bash
node --test android-bridge/tests/*.test.mjs lib/runtime/tests/*.test.mjs
npm run lint
npm run build
```

Local execution, configured provider access, and deployed end-to-end verification must be reported separately. No successful live GPT request is claimed by source inspection or mocked tests.

## Remaining integration gates
1. Neural Link/RAG retrieval with explicit tenant/user isolation.
2. MCP tool registry and connector permission mapping.
3. Per-device identity, token rotation/revocation, replay protection, and rate limiting.
4. Human approval and signed, expiring task envelopes before any state-changing operation.
5. Durable append-only audit evidence and correlation IDs.
6. Live Termux-to-preview GPT test and negative authentication tests.
