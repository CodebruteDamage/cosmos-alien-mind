# Cosmos Alien Mind

Responsive Next.js foundation for the COSMOS assistant dashboard and authenticated Android bridge.

## Current functionality

- Cosmic dark dashboard, responsive for desktop and mobile.
- Server-side Neon Postgres client and conversation persistence.
- Database health endpoint: `GET /api/health`.
- Conversation endpoints: `GET/POST /api/conversations`.
- Read-only Termux runtime probe and authenticated device heartbeat.
- Authenticated GPT response endpoint: `POST /api/runtime/respond`.\n- Authenticated dual-core endpoint: `POST /api/runtime/dual-core/respond` (GPT + Claude).
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

This milestone does not implement Neural Link/RAG retrieval, MCP tool invocation, per-device credential issuance/revocation, rate limiting, signed task dispatch, human approval for state-changing tasks, or durable append-only runtime audit storage. The GPT and dual-core response endpoints do not execute model-generated tools, shell commands, file changes, or package installs. The dual-core endpoint requires both `OPENAI_API_KEY` and `ANTHROPIC_API_KEY`; disagreement or incomplete structured output returns `needs_review`.

The existing conversation endpoints are not authenticated and do not provide per-user data isolation. Do not expose them as a production multi-user service. This branch is an integration prototype, not production certification.


## COSMOS real-time visual analytics

The command-center analytics view reuses the authenticated event store from the Live Data Swarm implementation. It does not create a second telemetry ingestion API or duplicate event tables.

### Configuration

- Configure `COSMOS_SWARM_TOKEN` as a server-only secret of at least 32 characters, shared only with trusted node agents and the authenticated dashboard operator.
- Configure `DATABASE_URL` server-side.
- Review and apply the additive `db/swarm-schema.sql` migration from the `feat/live-data-swarm` implementation before connecting trusted nodes.
- Connect through the dashboard's operator-token form. The token is held in page memory and is not written to local storage. Analytics requests are sent with the existing bearer token; no public browser endpoint is added.

### Analytics

- `GET /api/analytics?window=60&limit=200` requires the same bearer token as `/api/swarm`.
- Returns event count, distinct nodes represented by recent events, error/failure event counts, policy/security event counts, event-type distribution, node workload distribution, minute-bucket timeline, and the latest event sequence/time.
- Refreshes at a bounded ten-second interval while connected. Every query is bounded to 500 events and a 5-minute to 24-hour window.
- Classification of error/security activity is based on event-type naming conventions. It is an observability signal, not a security verdict.
- No sample telemetry is presented as live data. Local simulation and real swarm connection remain explicitly distinct.

### Validation limits

Unit tests and a successful build do not prove a live database migration, node-agent connectivity, provider inference, or production multi-user security. The conversation endpoints remain unauthenticated as described above. Do not deploy this as a public multi-user system until authentication, per-user isolation, rate limiting, and abuse controls are implemented.
