# Cosmos Alien Mind

Responsive Next.js foundation for the COSMOS assistant dashboard and authenticated Android bridge.

## Current functionality

- Cosmic dark dashboard, responsive for desktop and mobile.
- Server-side Neon Postgres client and conversation persistence.
- Database health endpoint: `GET /api/health`.
- Conversation endpoints: `GET/POST /api/conversations`.
- Read-only Termux runtime probe and authenticated device heartbeat.
- Authenticated GPT response endpoint: `POST /api/runtime/respond`.
- Provider adapter uses the OpenAI Responses API with server-side credentials and `store: false`.
- Runtime response includes lifecycle evidence and explicitly reports that tool execution and durable runtime persistence are disabled.

## Local setup

1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure `DATABASE_URL`, `BRIDGE_SHARED_SECRET` (at least 32 characters), `OPENAI_API_KEY`, and optionally `OPENAI_MODEL` in the server environment.
5. Apply `db/schema.sql` and `db/migrations/20261125_android_bridge_devices.sql` to the intended Neon database.
6. Start the app: `npm run dev`.

## Termux

Run the local read-only probe:

```bash
node android-bridge/src/probe.mjs
```

Send an authenticated heartbeat using the provisioning steps in `android-bridge/PROVISIONING.md`.

Send a GPT request from Termux:

```bash
node android-bridge/src/assistant.mjs "Summarize the COSMOS runtime status"
```

The bridge URL must be HTTPS except for localhost development. Keep the bridge token in the Termux environment and the OpenAI key in the server environment. Never commit or paste secrets.

## Validation

```bash
node --test android-bridge/tests/*.test.mjs lib/runtime/tests/*.test.mjs
npm run lint
npm run build
```

GitHub Actions runs the same checks on the isolated integration branch.

## Explicit limitations

This milestone does not implement Neural Link/RAG retrieval, MCP tool invocation, per-device credential issuance/revocation, rate limiting, signed task dispatch, human approval for state-changing tasks, or durable append-only runtime audit storage. The GPT response endpoint does not execute model-generated tools, shell commands, file changes, or package installs.

The existing conversation endpoints are not authenticated and do not provide per-user data isolation. Do not expose them as a production multi-user service. This branch is an integration prototype, not production certification.
