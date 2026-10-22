# Cosmos Alien Mind

Responsive Next.js MVP foundation for the Cosmos AI personal assistant dashboard.

## Current functionality

- Cosmic dark dashboard, responsive for desktop and mobile.
- Server-side Neon Postgres client using `DATABASE_URL`.
- Database health endpoint: `GET /api/health`.
- Conversation persistence endpoints: `GET /api/conversations` and `POST /api/conversations`.
- Input validation and generic public-facing database errors.
- No API keys or database credentials are committed.

**Not implemented yet:** live AI/model inference, authentication, per-user data isolation, and production abuse controls. Do not treat this as a production-ready multi-user service until these are implemented.

## Local setup

1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `DATABASE_URL` to the Neon connection string in `.env.local`. Keep it server-only; never use a `NEXT_PUBLIC_` prefix.
5. In the intended Neon database, run the SQL in `db/schema.sql`.
6. Start the app: `npm run dev`.
7. Check `http://localhost:3000/api/health`. A successful result should report `"database":"connected"`.
8. Submit a prompt on the dashboard and confirm it appears in the memory log.

## Neon schema

The schema creates `conversations` and `messages` tables with UUID keys, constraints, foreign-key cascade deletion, and lookup indexes. Apply it only to the intended project/database.

## Deploy

Import this repository into Vercel (or connect it to the existing Cosmos deployment only after verifying the intended project). Configure `DATABASE_URL` in the hosting provider's server-side environment settings for each environment, then redeploy. Do not paste secrets into GitHub, source code, screenshots, or chat.

## Security notes

- This MVP does not yet authenticate users. Do not store sensitive/private conversations or expose the public write endpoint as a production service until authentication, authorization, rate limiting, and abuse protection are added.
- The health route returns only generic failure status; it does not expose credentials.
- Real AI inference should be added as a server-side provider adapter with secret keys held only in server environment variables.


## COSMOS Live Data Swarm (preview implementation)

The swarm API is a server-to-server endpoint for node health heartbeats and replayable telemetry events. It does not make the existing dashboard authenticated; do not expose the bearer token to browser code.

### Configure safely

1. Review `db/swarm-schema.sql` and apply it to the intended Neon database. This is an additive migration and leaves the conversation tables intact.
2. Create a cryptographically random token of at least 32 characters. Set it as the server-only `COSMOS_SWARM_TOKEN` in Vercel Preview and Production, and as `COSMOS_SWARM_TOKEN` in the trusted local node agent's environment. Never use a `NEXT_PUBLIC_` prefix, commit the value, or paste it into logs.
3. Keep `DATABASE_URL` configured server-side with the Neon connection string.
4. Deploy the feature branch to a Preview deployment and verify the API before merging.

### API contract

- `POST /api/swarm` — authenticated node heartbeat plus up to 20 idempotent telemetry events. Requires `Authorization: Bearer <COSMOS_SWARM_TOKEN>`.
- `GET /api/swarm` — with no `after` query parameter, returns a node snapshot and sequence cursor; with `?after=<cursor>&limit=100`, returns ordered incremental events for replay. The maximum page size is 500.
- Node freshness is derived from server-recorded heartbeat time: online up to 30 seconds, degraded after 30 seconds, offline after 90 seconds. Freshness is reported by the snapshot endpoint.
- Telemetry event IDs must be UUIDs. Duplicate telemetry event IDs are ignored. Consumers should persist their last cursor and replay until `hasMore` is false after reconnecting.
- Use bounded polling for Vercel serverless deployments; do not hold a serverless function open indefinitely for SSE. All responses disable caching.
- This initial endpoint uses one shared service token, so only trusted agents should receive it; it does not yet provide per-device identity, per-user dashboard sessions, or application-level rate limiting. Add per-node credentials and rate limiting before broad production exposure.

### Tests

Run `npm test` with Node.js 22.7+ (the built-in TypeScript type-strip test runner) and `npm run lint` / `npm run build`. The swarm endpoints return 503 until both `COSMOS_SWARM_TOKEN`, `DATABASE_URL`, and the migration are configured. No deployment or live database test is implied by a passing unit test.
